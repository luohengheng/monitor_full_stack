import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { SpanService } from "./span.service";

@Controller()
export class SpanController {
  constructor(private readonly spanService: SpanService) {}

  /**
   * POST 请求处理 - 兼容 sendBeacon 和 fetch 方式
   * sendBeacon 和 fetch 都使用 POST 方法，数据在 body 中
   */
  @Post("tracking")
  trackingPost(
    @Body() body: Record<string, unknown>, // 从请求体获取数据
  ) {
    // 调用 service 处理数据
    return this.spanService.tracking(body);
  }

  /**
   * GET 请求处理 - 兼容图片打点方式
   * 图片打点使用 GET 方法，数据在查询参数 data 中（URL 编码的 JSON 字符串）
   */
  @Get("tracking")
  trackingGet(
    @Query("data") data?: string, // 从查询参数获取编码后的数据（可选）
  ) {
    // 检查 data 参数是否存在
    if (!data) {
      throw new Error("Missing required query parameter: data");
    }
    try {
      // 解码 URL 编码的数据
      const decodedData = decodeURIComponent(data);
      // 解析 JSON 字符串为对象
      const body = JSON.parse(decodedData) as Record<string, unknown>;
      // 调用 service 处理数据
      return this.spanService.tracking(body);
    } catch (error) {
      // 如果解析失败，抛出错误
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to parse data from query parameter: ${errorMessage}`,
      );
    }
  }
}
