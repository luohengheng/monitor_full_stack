export interface Transport {
  send(data: Record<string, unknown>): void; // 发送数据的方法
}

// 监控配置选项接口（用于获取 dsn、apikey 等）
interface TransportOptions {
  dsn: string; // 监控数据上报地址
  apikey: string; // 项目标识
  userId?: string; // 用户ID（可选）
}

// sendBeacon 的数据大小限制（通常为 64KB）
const SEND_BEACON_MAX_SIZE = 64 * 1024; // 64KB

// 图片打点的 URL 长度限制（保守估计 2KB）
const IMAGE_BEACON_MAX_SIZE = 2 * 1024; // 2KB

/**
 * 创建 HTTP Transport 实例
 * 上报策略：
 * 1. 优先使用 sendBeacon（适合小数据量，即使页面关闭也能发送）
 * 2. 如果数据量大，使用 fetch 上报
 * 3. 如果 fetch 不可用，使用图片打点上报（数据会被截断）
 * @param options 传输配置选项
 * @returns Transport 实例
 */
export function createHttpTransport(options: TransportOptions): Transport {
  /**
   * 使用 sendBeacon 发送数据
   * sendBeacon 的优势：即使页面关闭也能发送数据
   * @param url 上报地址
   * @param data 要发送的数据
   * @returns 是否发送成功
   */
  function sendWithBeacon(url: string, data: string): boolean {
    // 检查是否支持 sendBeacon
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        // 使用 Blob 发送数据，设置 Content-Type
        const blob = new Blob([data], { type: "application/json" });
        return navigator.sendBeacon(url, blob);
      } catch (error) {
        console.warn("Monitor: sendBeacon failed, fallback to fetch", error);
        return false;
      }
    }
    return false;
  }

  /**
   * 使用 fetch 发送数据
   * fetch 的优势：支持大数据量和自定义请求头
   * @param url 上报地址
   * @param data 要发送的数据
   * @returns Promise<void>
   */
  function sendWithFetch(url: string, data: string): Promise<void> {
    // 检查是否支持 fetch
    if (typeof fetch !== "undefined") {
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
        keepalive: true, // 保持连接，即使页面关闭也能发送
      })
        .then(() => {
          // 发送成功
        })
        .catch((error) => {
          console.error("Monitor: fetch send error", error);
          throw error;
        });
    }
    return Promise.reject(new Error("fetch is not available"));
  }

  /**
   * 使用图片打点发送数据
   * 图片打点的优势：兼容性好，但数据量有限（受 URL 长度限制）
   * @param url 上报地址
   * @param data 要发送的数据（会被编码到 URL 中）
   */
  function sendWithImage(url: string, data: string): void {
    try {
      // 将数据编码为 URL 安全的字符串
      const encodedData = encodeURIComponent(data); // URL 编码
      // 构建图片 URL（GET 请求）
      // 将数据作为查询参数传递
      const separator = url.includes("?") ? "&" : "?"; // 判断 URL 是否已有参数
      const imageUrl = `${url}${separator}data=${encodedData}`; // 构建完整 URL

      // 检查 URL 长度是否超过限制
      if (imageUrl.length > IMAGE_BEACON_MAX_SIZE) {
        // URL 太长，无法使用图片打点
        console.warn(
          `Monitor: image beacon URL too long (${imageUrl.length} bytes), cannot send`,
        );
        return;
      }

      const img = new Image();
      // 设置超时处理
      const timeout = setTimeout(() => {
        // 超时后清理
        img.onload = null;
        img.onerror = null;
      }, 1000);

      // 设置加载完成回调
      img.onload = () => {
        clearTimeout(timeout);
      };
      // 设置错误回调
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn("Monitor: image beacon failed");
      };

      // 设置图片源，触发请求
      img.src = imageUrl;
    } catch (error) {
      console.error("Monitor: image beacon error", error);
    }
  }

  /**
   * 发送数据的主方法
   * 根据数据大小选择合适的上报方式
   * @param data 要发送的数据对象
   */
  function send(data: Record<string, unknown>): void {
    // 合并配置信息到数据中
    const payload = {
      ...data, // 合并传入的数据
      apikey: options.apikey, // 添加项目标识
      userId: options.userId, // 添加用户ID
    };

    // 将数据序列化为 JSON 字符串
    const jsonData = JSON.stringify(payload);
    const dataSize = new Blob([jsonData]).size; // 计算数据大小（字节）

    // 策略1：如果数据量小（<= 64KB），优先使用 sendBeacon
    if (dataSize <= SEND_BEACON_MAX_SIZE) {
      // 尝试使用 sendBeacon
      const success = sendWithBeacon(options.dsn, jsonData);
      if (success) {
        return;
      }
      // sendBeacon 失败，继续尝试 fetch
    }

    // 策略2：使用 fetch 发送数据（支持大数据量）
    if (typeof fetch !== "undefined") {
      sendWithFetch(options.dsn, jsonData)
        .then(() => {
          // fetch 发送成功
        })
        .catch((error) => {
          // fetch 失败，根据数据大小决定降级策略
          // 对于录屏等大数据量，不应该降级到图片打点
          if (dataSize <= IMAGE_BEACON_MAX_SIZE) {
            // 数据量小，可以降级到图片打点
            sendWithImage(options.dsn, jsonData); // 使用图片打点
          } else {
            // 数据量太大，无法使用图片打点
            // 对于录屏等大数据量，只记录警告，不尝试图片打点
            console.warn(
              `Monitor: fetch send failed for large data (${dataSize} bytes), cannot fallback to image beacon`,
              error,
            );
          }
        });
      return; // 已尝试 fetch，返回
    }

    // 策略3：如果 fetch 不可用，且数据量小（<= 2KB），使用图片打点
    if (dataSize <= IMAGE_BEACON_MAX_SIZE) {
      sendWithImage(options.dsn, jsonData);
    } else {
      // 数据量太大且没有可用的上报方式
      console.warn(
        `Monitor: data size (${dataSize} bytes) is too large and no available transport method`,
      );
    }
  }

  return { send };
}
