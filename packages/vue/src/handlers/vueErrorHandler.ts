import type { MonitorOptions } from "@monitor_full_stack/core"; // 从 core 包导入监控配置选项类型
// 导入传输实例获取函数和面包屑管理器
import {
  BreadcrumbManager,
  getTransport,
  markError,
} from "@monitor_full_stack/core";

import type { VueApp } from "../types/types";

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
    recentErrors.set(fingerprint, now);
    // 清理过期的错误记录（超过5秒的记录）
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
 * 设置 Vue3 错误处理器
 * @param app Vue3 应用实例
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
export function setupVueErrorHandler(
  app: VueApp, // Vue3 应用实例
  options: MonitorOptions, // 监控配置选项
  breadcrumbManager: BreadcrumbManager, // 面包屑管理器
): void {
  // 设置 Vue3 的错误处理器
  const originalErrorHandler = app.config.errorHandler; // 保存原有的错误处理器

  app.config.errorHandler = (err: unknown, instance: unknown, info: string) => {
    // 如果配置了监控错误事件，则上报错误
    if (!options.silentError) {
      // 将错误转换为 Error 对象（如果还不是）
      const error = err instanceof Error ? err : new Error(String(err));

      // 生成错误指纹用于去重
      const fingerprint = getErrorFingerprint(error, "vue-error");

      // 检查错误是否在去重窗口内
      if (!shouldReportError(fingerprint)) {
        // 在去重窗口内，跳过上报
        // 但仍然调用原有的错误处理器
        if (originalErrorHandler) {
          originalErrorHandler(err, instance, info);
        } else {
          console.error("Vue error:", err, info);
        }
        // 调试信息：错误在去重窗口内，跳过上报
        console.debug("Monitor: Vue error skipped (deduplication window)", {
          message: error.message,
          info,
        });
        return;
      }

      // 调试信息：准备上报 Vue 错误
      console.debug("Monitor: Reporting Vue error", {
        message: error.message,
        info,
        fingerprint,
      });

      // 如果开启了录屏功能，标记发生错误
      if (!options.silentRecordScreen) {
        markError();
      }

      // 获取传输实例并发送错误信息
      const transport = getTransport();
      if (transport) {
        // 检查是否在浏览器环境
        const isBrowser =
          typeof window !== "undefined" && typeof navigator !== "undefined";
        // 构建详细的错误信息
        const errorInfo: Record<string, unknown> = {
          message: error.message || "Unknown Vue error",
          stack: error.stack || "No stack trace available",
          name: error.name || "Error", // 错误名称
          url: isBrowser ? window.location.href : "Unknown", // 当前页面URL（检查浏览器环境）
          userAgent: isBrowser ? navigator.userAgent : "Unknown", // 用户代理信息（检查浏览器环境）
        };

        // 如果堆栈信息存在，尝试解析堆栈中的文件位置
        if (error.stack) {
          const stackLines = error.stack.split("\n");
          if (stackLines.length > 0) {
            errorInfo.stackTrace = stackLines.slice(0, 10);
          }
        }

        // 尝试从 Vue 组件实例中提取组件信息
        let componentInfo: Record<string, unknown> | null = null;
        if (instance && typeof instance === "object") {
          try {
            // 尝试获取组件名称和路径
            const vm = instance as Record<string, unknown>;
            componentInfo = {
              $options: vm.$options ? String(vm.$options) : undefined,
              $vnode: vm.$vnode ? String(vm.$vnode) : undefined,
            };
          } catch {
            // 忽略提取组件信息时的错误
            componentInfo = null;
          }
        }

        // 使用 transport 发送错误信息
        transport.send({
          type: "vue-error", // 错误类型
          error: errorInfo, // 详细错误信息
          component: componentInfo, // Vue 组件信息
          info: info || "No additional info", // 错误信息（Vue 提供的额外信息）
          breadcrumbs: breadcrumbManager.getBreadcrumbs(), // 包含面包屑
          timestamp: new Date().toISOString(), // 时间戳
        });

        // 调试信息：Vue 错误已发送
        console.debug("Monitor: Vue error sent successfully", {
          message: error.message,
          info,
        });
      }
    }

    if (originalErrorHandler) {
      originalErrorHandler(err, instance, info);
    } else {
      console.error("Vue error:", err, info);
    }
  };
}
