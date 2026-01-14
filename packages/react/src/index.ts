// 导入 Monitor 类和类型定义
import { Monitor, type MonitorOptions } from "@monitor_full_stack/core"; // 监控核心类和配置选项类型

// 导入错误边界组件
import { ErrorBoundary } from "./components/ErrorBoundary"; // React 错误边界组件

/**
 * 初始化 React 监控
 * @param options 监控配置选项
 */
export function init(options: MonitorOptions): void {
  // 初始化监控（这会初始化所有基础监控功能：错误、XHR、Fetch、点击、路由、性能、白屏、录屏等）
  Monitor.init(options);
}

// 导出默认对象
export default {
  init,
  ErrorBoundary,
};

export type { MonitorOptions };
