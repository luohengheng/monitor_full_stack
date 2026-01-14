// 导入传输实例获取函数和面包屑管理器
import { getTransport } from "../baseClient";
import type { FetchInterface, MonitorOptions } from "../types/monitorOptions";

/**
 * 上报 Fetch 请求信息
 * @param info 请求信息
 * @param options 监控配置选项
 */
function reportFetchRequest(
  info: FetchInterface,
  options: MonitorOptions,
): void {
  // 检查配置是否允许监控 Fetch
  if (options.silentFetch) {
    return; // 如果配置为静默，则不监控
  }

  // 获取传输实例
  const transport = getTransport(); // 获取 transport 实例
  if (transport) {
    // 使用 transport 发送请求信息
    transport.send({
      type: "fetch-request", // 请求类型
      method: info.method, // 请求方法
      url: info.url, // 请求 URL
      duration: info.duration, // 请求耗时（毫秒）
      success: info.success, // 是否成功
      status: info.status, // 响应状态码
      statusText: info.statusText, // 响应状态文本
      error: info.error, // 错误信息
      timestamp: new Date().toISOString(), // 时间戳
    });
  }
}

/**
 * 设置 Fetch 请求监控
 * @param options 监控配置选项
 */
export function setupFetchHandler(options: MonitorOptions): void {
  // 检查是否支持 fetch
  if (typeof window === "undefined" || typeof window.fetch === "undefined") {
    return;
  }

  // 保存原始的 fetch 方法
  const originalFetch = window.fetch;

  // 重写 fetch 方法
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // 记录请求信息
    const requestInfo: {
      method?: string; // 请求方法
      url?: string; // 请求 URL
      startTime?: number; // 开始时间
    } = {}; // 请求信息对象

    // 解析请求 URL
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestInfo.url = url;
    requestInfo.method = init?.method || "GET"; // 获取请求方法，默认为 GET
    requestInfo.startTime = Date.now(); // 记录开始时间

    // 调用原始的 fetch 方法
    return originalFetch
      .call(this, input, init)
      .then((response: Response) => {
        // 请求成功，上报请求信息
        const duration = requestInfo.startTime
          ? Date.now() - requestInfo.startTime
          : 0; // 计算耗时

        // 上报请求信息
        reportFetchRequest(
          {
            method: requestInfo.method, // 请求方法
            url: requestInfo.url, // 请求 URL
            duration: duration, // 请求耗时
            success: response.ok, // 判断是否成功（status 200-299）
            status: response.status, // 响应状态码
            statusText: response.statusText, // 响应状态文本
          },
          options,
        );

        return response;
      })
      .catch((error: unknown) => {
        // 请求失败，上报错误信息
        const duration = requestInfo.startTime
          ? Date.now() - requestInfo.startTime
          : 0; // 计算耗时

        // 获取错误信息
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : error
              ? String(error)
              : "Fetch error";

        // 上报请求错误
        reportFetchRequest(
          {
            method: requestInfo.method,
            url: requestInfo.url,
            duration: duration,
            success: false,
            error: errorMessage,
          },
          options,
        );

        throw error;
      });
  };
}
