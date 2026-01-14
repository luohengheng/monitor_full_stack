import { Monitoring } from "./baseClient";
import { BreadcrumbManager } from "./breadcrumb";
import { setupClickHandler } from "./handlers/clickHandler";
import {
  setupErrorHandler,
  setupUnhandledRejectionHandler,
} from "./handlers/errorHandler";
import { setupFetchHandler } from "./handlers/fetchHandler";
import { setupPerformanceHandler } from "./handlers/performanceHandler";
import { setupRecordScreenHandler } from "./handlers/recordScreenHandler";
import {
  setupHashchangeHandler,
  setupHistoryHandler,
} from "./handlers/routeHandler";
import { setupWhiteScreenHandler } from "./handlers/whiteScreenHandler";
import { setupXhrHandler } from "./handlers/xhrHandler";
import { createHttpTransport } from "./transport";
import type { BreadcrumbType, MonitorOptions } from "./types/monitorOptions";

// Monitor 类，提供静态方法用于初始化和安装
export class Monitor {
  private static instance: Monitoring | null = null;
  private static options: MonitorOptions | null = null;
  private static breadcrumbManager: BreadcrumbManager = new BreadcrumbManager();

  /**
   * 初始化监控配置
   * @param options 监控配置选项
   */
  static init(options: MonitorOptions): void {
    // 保存配置选项
    Monitor.options = options;
    // 设置面包屑管理器配置
    Monitor.breadcrumbManager.setOptions(options);
    // 清空之前的面包屑数据
    Monitor.clearBreadcrumbs();

    // 使用 createHttpTransport 创建，优先使用 sendBeacon，数据量大时使用 fetch 或图片打点
    const transport = createHttpTransport({
      dsn: options.dsn,
      apikey: options.apikey,
      userId: options.userId,
    });

    // 创建 Monitoring 实例
    Monitor.instance = new Monitoring({
      dsn: options.dsn, // 设置上报地址
      integrations: [], // 集成列表，后续可以添加
    });
    // 初始化传输
    Monitor.instance.init(transport);

    // 根据配置选项初始化各种监控功能
    if (!options.silentError) {
      // 监控全局错误
      setupErrorHandler(options, Monitor.breadcrumbManager);
    }

    if (!options.silentUnhandledrejection) {
      // 监控未处理的 Promise 拒绝
      setupUnhandledRejectionHandler(options, Monitor.breadcrumbManager);
    }

    if (!options.silentXhr) {
      // 监控 XHR 请求
      setupXhrHandler(options);
    }

    if (!options.silentFetch) {
      // 监控 Fetch 请求
      setupFetchHandler(options);
    }

    if (!options.silentClick) {
      // 监控点击事件
      setupClickHandler(options, Monitor.breadcrumbManager);
    }

    if (!options.silentHashchange) {
      // 监控 hash 路由变化
      setupHashchangeHandler(options, Monitor.breadcrumbManager);
    }

    if (!options.silentHistory) {
      // 监控 history 路由变化
      setupHistoryHandler(options, Monitor.breadcrumbManager);
    }

    if (!options.silentPerformance) {
      // 获取页面性能指标
      setupPerformanceHandler(options);
    }

    if (!options.silentWhiteScreen) {
      // 开启白屏检测
      setupWhiteScreenHandler(options);
    }

    if (!options.silentRecordScreen) {
      // 开启录屏功能
      setupRecordScreenHandler(options); // 启动录屏
    }
  }

  /**
   * 添加用户自定义面包屑
   * @param message 消息内容
   * @param data 附加数据（可选）
   * @param level 级别（可选，默认为 'info'）
   */
  static addCustomBreadcrumb(
    type: BreadcrumbType,
    message?: string,
    data?: Record<string, unknown>,
    level: "info" | "warning" | "error" = "info",
  ): void {
    // 添加自定义面包屑
    Monitor.breadcrumbManager.addBreadcrumb(type, message, data, level); // 调用内部方法
  }

  /**
   * 获取所有面包屑（公开方法）
   * @returns 面包屑数组
   */
  static getBreadcrumbs() {
    // 返回面包屑数组的副本，避免外部修改
    return Monitor.breadcrumbManager.getBreadcrumbs();
  }

  /**
   * 清空面包屑
   */
  static clearBreadcrumbs(): void {
    // 清空面包屑数组
    Monitor.breadcrumbManager.clearBreadcrumbs();
  }

  /**
   * 获取面包屑管理器（用于外部访问）
   * @returns 面包屑管理器实例
   */
  static getBreadcrumbManager(): BreadcrumbManager {
    // 返回面包屑管理器实例
    return Monitor.breadcrumbManager;
  }
}
