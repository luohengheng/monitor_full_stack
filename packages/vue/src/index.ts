// 导入类型定义
import type { MonitorOptions } from "@monitor_full_stack/core"; // 监控配置选项类型
// 导入 Monitor 类
import { Monitor } from "@monitor_full_stack/core";

// 导入 Vue 错误处理器
import { setupVueErrorHandler } from "./handlers/vueErrorHandler"; // 从本地导入 Vue 错误处理器设置函数
import type { VueApp } from "./types/types";

/**
 * 使用监控插件的 install 方法，配置监控参数
 * 用于 Vue3 应用
 * @param app Vue3 应用实例
 * @param options 监控配置选项
 */
export function install(
  app: VueApp, // Vue3 应用实例
  options: MonitorOptions, // 监控配置选项
): void {
  // 先调用 init 方法初始化监控（这会初始化所有基础监控功能：错误、XHR、Fetch、点击、路由、性能、白屏、录屏等）
  Monitor.init(options);

  // 设置 Vue3 的错误处理器
  setupVueErrorHandler(app, options, Monitor.getBreadcrumbManager());
}

// 导出 Vue 应用类型
export type { VueApp } from "./types/types"; // 导出 Vue 应用类型

// 导出 install 方法作为默认导出
export default {
  install,
};

export type { MonitorOptions };
