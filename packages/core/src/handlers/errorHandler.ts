// 导入传输实例获取函数和面包屑管理器
import { getTransport } from "../baseClient";
import type { BreadcrumbManager } from "../breadcrumb";
import type { MonitorOptions } from "../types/monitorOptions";
import { markError } from "./recordScreenHandler";

// 错误去重机制：存储最近上报的错误，避免重复上报
const recentErrors = new Map<string, number>(); // 错误指纹 -> 时间戳
const ERROR_DEDUP_WINDOW = 1000; // 去重时间窗口（1秒内相同错误只上报一次）

/**
 * 生成错误指纹，用于去重
 * @param error 错误对象或错误信息
 * @param type 错误类型
 * @returns 错误指纹
 */
function getErrorFingerprint(error: unknown, type: string): string {
  // 如果是 Error 对象，使用堆栈信息
  if (error instanceof Error) {
    // 使用错误消息和堆栈的前几行作为指纹
    const stackPreview = error.stack
      ? error.stack.split("\n").slice(0, 3).join("")
      : ""; // 取前3行堆栈
    return `${type}:${error.message}:${stackPreview}`; // 组合指纹
  }
  return `${type}:${String(error)}`;
}

/**
 * 检查错误是否应该上报（去重检查）
 * @param fingerprint 错误指纹
 * @returns 是否应该上报
 */
function shouldReportError(fingerprint: string): boolean {
  const now = Date.now(); // 当前时间戳
  const lastReportTime = recentErrors.get(fingerprint); // 获取上次上报时间

  // 如果不在去重窗口内，或者从未上报过，则应该上报
  if (!lastReportTime || now - lastReportTime > ERROR_DEDUP_WINDOW) {
    recentErrors.set(fingerprint, now); // 记录上报时间
    // 清理过期的错误记录（超过5秒的记录）
    if (recentErrors.size > 100) {
      // 如果记录太多，清理旧的记录
      for (const [key, time] of recentErrors.entries()) {
        if (now - time > 5000) {
          // 超过5秒的记录删除
          recentErrors.delete(key);
        }
      }
    }
    return true;
  }

  return false;
}

/**
 * 设置全局错误处理器
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
export function setupErrorHandler(
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 监听全局错误事件
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      // 如果配置了监控错误事件，则上报错误
      if (!options.silentError) {
        // 检查错误堆栈，如果是 Vue 错误，可能已经被 Vue 错误处理器处理过了
        // 通过检查错误堆栈中是否包含 Vue 相关信息来判断
        const isVueError =
          event.error?.stack?.includes("vue") ||
          event.error?.stack?.includes("Vue"); // 检查是否是 Vue 错误

        // 生成错误指纹用于去重
        const fingerprint = getErrorFingerprint(
          event.error || event.message,
          "js-error",
        );

        // 如果是 Vue 错误，跳过上报（由 Vue 错误处理器处理）
        // 或者如果错误在去重窗口内，也跳过
        if (isVueError || !shouldReportError(fingerprint)) {
          return;
        }

        // 如果开启了录屏功能，标记发生错误
        if (!options.silentRecordScreen) {
          markError(); // 标记错误，用于录屏上报
        }

        // 获取传输实例并发送错误信息
        const transport = getTransport(); // 获取 transport 实例
        if (transport) {
          // 构建详细的错误信息
          const errorInfo: Record<string, unknown> = {
            message: event.message || "Unknown error", // 错误消息
            filename: event.filename || "Unknown file", // 文件名
            lineno: event.lineno || 0, // 行号
            colno: event.colno || 0, // 列号
            url: window.location.href, // 当前页面URL
            userAgent: navigator.userAgent, // 用户代理信息
          };

          // 如果有错误对象，添加详细信息
          if (event.error) {
            errorInfo.error = {
              message: event.error.message || "Unknown error message", // 错误消息
              stack: event.error.stack || "No stack trace available", // 错误堆栈
              name: event.error.name || "Error", // 错误名称
            };
            // 如果堆栈信息存在，尝试解析堆栈中的文件位置
            if (event.error.stack) {
              const stackLines = event.error.stack.split("\n"); // 分割堆栈行
              if (stackLines.length > 0) {
                errorInfo.stackTrace = stackLines.slice(0, 10); // 取前10行堆栈信息
              }
            }
          } else {
            // 没有错误对象，使用事件信息
            errorInfo.error = {
              message: event.message || "Unknown error", // 错误消息
              stack: `at ${event.filename}:${event.lineno}:${event.colno}`, // 构建堆栈信息
              name: "Error", // 错误名称
            };
          }

          // 使用 transport 发送错误信息
          transport.send({
            type: "error",
            error: errorInfo,
            breadcrumbs: breadcrumbManager.getBreadcrumbs(),
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  }
}

/**
 * 设置未处理的 Promise 拒绝处理器
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
export function setupUnhandledRejectionHandler(
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 监听未处理的 Promise 拒绝事件
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      // 如果配置了监控未处理的 Promise 拒绝，则上报
      if (!options.silentUnhandledrejection) {
        // 生成错误指纹用于去重
        const fingerprint = getErrorFingerprint(
          event.reason,
          "unhandledrejection",
        ); // 生成指纹

        // 检查错误是否在去重窗口内
        if (!shouldReportError(fingerprint)) {
          return;
        }

        // 如果开启了录屏功能，标记发生错误
        if (!options.silentRecordScreen) {
          markError(); // 标记错误，用于录屏上报
        }

        // 获取传输实例并发送错误信息
        const transport = getTransport(); // 获取 transport 实例
        if (transport) {
          // 构建详细的错误信息
          const reason = event.reason; // 获取拒绝原因
          let errorMessage = "Unknown rejection"; // 默认错误消息
          let errorStack = "No stack trace available"; // 默认堆栈信息
          let errorName = "UnhandledRejection"; // 默认错误名称

          // 如果拒绝原因是 Error 对象，提取详细信息
          if (reason instanceof Error) {
            errorMessage = reason.message || "Unknown error message"; // 错误消息
            errorStack = reason.stack || "No stack trace available"; // 错误堆栈
            errorName = reason.name || "Error"; // 错误名称
          } else if (typeof reason === "string") {
            errorMessage = reason; // 字符串类型的拒绝原因
          } else if (reason && typeof reason === "object") {
            // 对象类型的拒绝原因，尝试转换为字符串
            try {
              errorMessage = JSON.stringify(reason);
            } catch {
              errorMessage = String(reason);
            }
          } else {
            errorMessage = String(reason);
          }

          // 使用 transport 发送错误信息
          // httpTransport 会自动添加 apikey 和 userId，无需重复添加
          transport.send({
            type: "unhandledrejection", // 错误类型
            error: {
              reason: errorMessage,
              name: errorName,
              stack: errorStack,
              originalReason:
                reason instanceof Error
                  ? {
                      message: reason.message,
                      stack: reason.stack,
                      name: reason.name,
                    }
                  : reason, // 原始拒绝原因
              url: window.location.href, // 当前页面URL
              userAgent: navigator.userAgent, // 用户代理信息
            },
            breadcrumbs: breadcrumbManager.getBreadcrumbs(),
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  }
}
