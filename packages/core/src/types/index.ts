import type { Transport } from "../transport"; // 导入传输类型

/**
 * 插件协议
 * 定义集成接口，用于扩展监控功能
 */
export interface IIntegration {
  init(transport: Transport): void; // 初始化集成的方法
}

// Integration 类，实现 IIntegration 接口
export class Integration implements IIntegration {
  transport: Transport | null = null; // 传输实例

  // 初始化集成
  init(transport: Transport): void {
    this.transport = transport; // 保存传输实例
  }
}

/**
 * monitoring 参数项
 * 定义监控配置选项
 */
export interface MonitoringOptions {
  dsn: string; // 监控数据上报地址
  integrations?: Integration[]; // 集成列表（可选）
}
