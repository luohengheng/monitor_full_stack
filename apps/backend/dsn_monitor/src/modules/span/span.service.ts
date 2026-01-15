import type { ClickHouseClient } from "@clickhouse/client";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class SpanService {
  constructor(
    @Inject("CLICKHOUSE_CLIENT")
    private readonly clickhouseClient: ClickHouseClient,
  ) {}

  /**
   * 处理监控数据上报
   * 兼容前端三种发送方式：sendBeacon、fetch、图片打点
   * @param app_id 应用ID（从 URL 参数获取，如果 payload 中有 apikey 则优先使用）
   * @param params 前端发送的数据对象
   */
  async tracking(params: Record<string, unknown>): Promise<void> {
    // 提取其他所有字段，放入 info 中
    // 排除已提取的字段：apikey, type, message
    const { apikey, type, message, ...rest } = params;

    // 从 payload 中提取 apikey（如果存在，优先使用 apikey 作为 app_id）
    const finalAppId = apikey as string;

    // 从 payload 中提取 event_type（前端使用 type 字段）
    const eventType = (type as string) || "";

    // 从 payload 中提取 message（可选字段）
    const _message = (message as string) || null;

    // 构建要存储的数据对象
    const values = {
      app_id: finalAppId, // 应用ID
      event_type: eventType, // 事件类型
      message: _message, // 消息内容（可选）
      info: JSON.stringify(rest), // 其他所有字段序列化为 JSON 字符串
    };

    // 写入数据到clickhouse
    await this.clickhouseClient.insert({
      table: "lwhclickhouse.base_monitor_storage",
      values,
      columns: ["app_id", "event_type", "message", "info"],
      format: "JSONEachRow",
    });
  }
}
