import type { Transport } from "./transport";
import type { MonitoringOptions } from "./types";

export let getTransport = (): Transport | null => null;

// Monitoring 类，用于管理监控功能
export class Monitoring {
  // 监控配置选项
  private options: MonitoringOptions;
  // 传输实例
  private transport: Transport | null = null;

  // 构造函数，初始化监控配置
  constructor(options: MonitoringOptions) {
    this.options = options;
  }

  // 初始化传输实例
  init(transport: Transport): void {
    this.transport = transport;
    getTransport = () => this.transport; // 更新全局获取函数

    // 初始化所有集成
    for (const integration of this.options.integrations ?? []) {
      integration.init(transport);
    }
  }
}
