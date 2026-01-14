import type { MonitorOptions } from "@monitor_full_stack/core"; // 监控配置选项类型
import type { BreadcrumbManager } from "@monitor_full_stack/core"; // 面包屑管理器类型
import { getTransport, markError } from "@monitor_full_stack/core"; // 导入传输和录屏相关函数
import { Component, type ErrorInfo, type ReactNode } from "react"; // 导入 React 组件和类型

// 错误边界组件的 Props 接口
interface ErrorBoundaryProps {
  children: ReactNode; // 子组件
  options: MonitorOptions; // 监控配置选项
  breadcrumbManager: BreadcrumbManager; // 面包屑管理器
  fallback?: ReactNode; // 错误时的降级 UI
}

// 错误边界组件的 State 接口
interface ErrorBoundaryState {
  hasError: boolean; // 是否发生错误
  error: Error | null; // 错误对象
}

// 错误去重机制
const recentErrors = new Map<string, number>(); // 错误指纹 -> 时间戳
const ERROR_DEDUP_WINDOW = 1000; // 去重时间窗口（1秒内相同错误只上报一次）

/**
 * 生成错误指纹，用于去重
 */
function getErrorFingerprint(error: Error, type: string): string {
  const stackPreview = error.stack
    ? error.stack.split("\n").slice(0, 3).join("")
    : "";
  return `${type}:${error.message}:${stackPreview}`;
}

/**
 * 检查错误是否应该上报（去重检查）
 */
function shouldReportError(fingerprint: string): boolean {
  const now = Date.now();
  const lastReportTime = recentErrors.get(fingerprint);

  if (!lastReportTime || now - lastReportTime > ERROR_DEDUP_WINDOW) {
    recentErrors.set(fingerprint, now);
    // 清理过期的错误记录
    if (recentErrors.size > 100) {
      for (const [key, time] of recentErrors.entries()) {
        if (now - time > 5000) {
          recentErrors.delete(key);
        }
      }
    }
    return true;
  }

  return false;
}

/**
 * React 错误边界组件
 * 用于捕获子组件树中的 JavaScript 错误
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // 当子组件抛出错误时调用
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  // 错误发生时调用，用于上报错误
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { options, breadcrumbManager } = this.props;

    // 如果配置了监控错误事件，则上报错误
    if (!options.silentError) {
      const fingerprint = getErrorFingerprint(error, "react-error");

      // 检查错误是否在去重窗口内
      if (!shouldReportError(fingerprint)) {
        console.debug("Monitor: React error skipped (deduplication window)", {
          message: error.message,
          errorInfo,
        });
        return;
      }

      console.debug("Monitor: Reporting React error", {
        message: error.message,
        errorInfo,
        fingerprint,
      });

      // 如果开启了录屏功能，标记发生错误
      if (!options.silentRecordScreen) {
        markError();
      }

      // 获取传输实例并发送错误信息
      const transport = getTransport();
      if (transport) {
        const isBrowser =
          typeof window !== "undefined" && typeof navigator !== "undefined";

        // 构建详细的错误信息
        const errorInfoData: Record<string, unknown> = {
          message: error.message || "Unknown React error",
          stack: error.stack || "No stack trace available",
          name: error.name || "Error",
          url: isBrowser ? window.location.href : "Unknown",
          userAgent: isBrowser ? navigator.userAgent : "Unknown",
        };

        // 如果堆栈信息存在，解析堆栈
        if (error.stack) {
          const stackLines = error.stack.split("\n");
          if (stackLines.length > 0) {
            errorInfoData.stackTrace = stackLines.slice(0, 10);
          }
        }

        // 使用 transport 发送错误信息
        transport.send({
          type: "react-error",
          error: errorInfoData,
          componentStack: errorInfo.componentStack || "No component stack",
          breadcrumbs: breadcrumbManager.getBreadcrumbs(),
          timestamp: new Date().toISOString(),
        });

        console.debug("Monitor: React error sent successfully", {
          message: error.message,
        });
      }
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义降级 UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>出现了一些问题</h2>
          <p>抱歉，应用遇到了一个错误。</p>
          {this.state.error && (
            <details style={{ marginTop: "10px" }}>
              <summary>错误详情</summary>
              <pre style={{ textAlign: "left", marginTop: "10px" }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
