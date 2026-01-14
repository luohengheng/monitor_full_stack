import type {
  Breadcrumb,
  BreadcrumbType,
  MonitorOptions,
} from "./types/monitorOptions";

// 面包屑管理类
export class BreadcrumbManager {
  // 存储面包屑数据
  private breadcrumbs: Breadcrumb[] = [];

  // 存储当前配置选项
  private options: MonitorOptions | null = null;

  /**
   * 设置配置选项
   * @param options 监控配置选项
   */
  setOptions(options: MonitorOptions): void {
    this.options = options;
  }

  /**
   * 添加面包屑
   * @param type 面包屑类型
   * @param message 消息内容（可选）
   * @param data 附加数据（可选）
   * @param level 级别（可选）
   */
  addBreadcrumb(
    type: BreadcrumbType,
    message?: string,
    data?: Record<string, unknown>,
    level: "info" | "warning" | "error" = "info",
  ): void {
    // 检查是否配置了最大记录数
    const maxBreadcrumbs = this.options?.maxBreadcrumbs ?? 20; // 默认 20 条

    const breadcrumb: Breadcrumb = {
      type: type,
      message: message,
      data,
      timestamp: Date.now(),
      level: level,
    };

    this.breadcrumbs.push(breadcrumb);

    // 如果超过最大记录数，移除最旧的记录
    if (this.breadcrumbs.length > maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * 获取所有面包屑（公开方法）
   * @returns 面包屑数组
   */
  getBreadcrumbs(): Breadcrumb[] {
    // 返回面包屑数组的副本，避免外部修改
    return this.breadcrumbs.slice();
  }

  /**
   * 清空面包屑
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}
