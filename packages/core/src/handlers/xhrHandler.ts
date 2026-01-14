// 导入传输实例获取函数和面包屑管理器
import { getTransport } from "../baseClient";
import type { MonitorOptions, XhrInterface } from "../types/monitorOptions";

/**
 * 上报 XHR 请求信息
 * @param info 请求信息
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
function reportXhrRequest(info: XhrInterface, options: MonitorOptions): void {
  // 检查配置是否允许监控 XHR
  if (options.silentXhr) {
    return; // 如果配置为静默，则不监控
  }

  // 获取传输实例
  const transport = getTransport();
  if (transport) {
    // 使用 transport 发送请求信息
    transport.send({
      type: "xhr-request", // 请求类型
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
 * 设置 XHR 请求监控
 * @param options 监控配置选项
 */
export function setupXhrHandler(options: MonitorOptions): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined" || !window.XMLHttpRequest) {
    return; // 不在浏览器环境或不支持 XMLHttpRequest
  }

  // 保存原始的 XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;

  // 重写 XMLHttpRequest
  window.XMLHttpRequest = function (this: XMLHttpRequest) {
    const xhr = new OriginalXHR() as XMLHttpRequest;

    // 记录请求信息
    const requestInfo: {
      method?: string;
      url?: string;
      startTime?: number;
      status?: number;
      statusText?: string;
    } = {};

    // 重写 open 方法，记录请求信息
    const originalOpen = xhr.open; // 保存原始 open 方法
    xhr.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      // 记录请求方法和 URL
      requestInfo.method = method; // 保存请求方法
      requestInfo.url = typeof url === "string" ? url : url.toString(); // 保存请求 URL
      requestInfo.startTime = Date.now(); // 记录开始时间

      // 调用原始的 open 方法
      return originalOpen.call(
        this,
        method,
        url,
        async ?? true,
        username ?? null,
        password ?? null,
      );
    };

    // 重写 send 方法，监听请求完成
    const originalSend = xhr.send; // 保存原始 send 方法
    xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      // 监听 load 事件（请求成功）
      xhr.addEventListener("load", () => {
        // 记录响应信息
        requestInfo.status = xhr.status; // 保存状态码
        requestInfo.statusText = xhr.statusText; // 保存状态文本

        // 上报请求信息
        reportXhrRequest(
          {
            ...requestInfo,
            duration: requestInfo.startTime
              ? Date.now() - requestInfo.startTime
              : 0, // 计算请求耗时
            success: xhr.status >= 200 && xhr.status < 300, // 判断是否成功
          },
          options,
        );

        // 接口请求耗时过长也需要上报
      });

      // 监听 error 事件（请求失败）
      xhr.addEventListener("error", () => {
        // 上报请求错误
        reportXhrRequest(
          {
            ...requestInfo, // 展开请求信息
            duration: requestInfo.startTime
              ? Date.now() - requestInfo.startTime
              : 0, // 计算请求耗时
            success: false, // 标记为失败
            error: "Network error", // 错误信息
          },
          options,
        );
      });

      // 调用原始的 send 方法
      return originalSend.call(this, body ?? null);
    };

    return xhr; // 返回重写后的 XHR 实例
  } as unknown as typeof XMLHttpRequest;

  // 复制原始 XMLHttpRequest 的静态属性和方法
  Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR); // 设置原型链
  Object.setPrototypeOf(window.XMLHttpRequest.prototype, OriginalXHR.prototype); // 设置原型
}
