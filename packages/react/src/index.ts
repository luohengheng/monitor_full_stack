import {
  type BreadcrumbManager,
  Monitor,
  type MonitorOptions,
} from "@monitor_full_stack/core";

import { ErrorBoundary } from "./components/ErrorBoundary";

/**
 * 初始化 React 监控
 * @param options 监控配置选项
 */
export function init(options: MonitorOptions): void {
  // 初始化监控（这会初始化所有基础监控功能：错误、XHR、Fetch、点击、路由、性能、白屏、录屏等）
  Monitor.init(options);
}

/**
 * 获取面包屑管理器（用于 ErrorBoundary 等需要上报上下文的场景）
 * 需在 init() 之后调用
 */
export function getBreadcrumbManager(): BreadcrumbManager {
  return Monitor.getBreadcrumbManager();
}

// 导出默认对象
export default {
  init,
  ErrorBoundary,
  getBreadcrumbManager,
};

export type { MonitorOptions };
export { ErrorBoundary };
