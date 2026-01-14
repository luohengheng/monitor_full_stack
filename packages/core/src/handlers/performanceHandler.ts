import { getTransport } from "../baseClient";
import type { MonitorOptions } from "../types/monitorOptions";

/**
 * 收集页面性能指标
 * @param options 监控配置选项
 */
function collectPerformanceMetrics(options: MonitorOptions): void {
  // 检查配置是否允许监控性能指标
  if (options.silentPerformance) {
    return;
  }

  // 检查是否支持 Performance API
  if (typeof performance === "undefined") {
    return; // 不支持 Performance API
  }

  // 优先使用 PerformanceNavigationTiming API（现代 API，不废弃）
  // 如果不可用，降级使用 performance.timing（已废弃但兼容性好）
  let navTiming: PerformanceNavigationTiming | null = null;
  let legacyTiming: PerformanceTiming | null = null;

  // 尝试获取 PerformanceNavigationTiming
  if (performance.getEntriesByType) {
    try {
      const navEntries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        navTiming = navEntries[0] as PerformanceNavigationTiming;
      }
    } catch {
      // 捕获错误，继续尝试降级方案
      // 静默处理，不输出警告（因为这是正常的降级流程）
    }
  }

  // 降级使用 performance.timing（已废弃但兼容性好）
  if (!navTiming && (performance as { timing?: PerformanceTiming }).timing) {
    legacyTiming = (performance as { timing: PerformanceTiming }).timing;
  }

  if (!navTiming && !legacyTiming) {
    return; // 无法获取性能数据
  }

  // 计算各项性能指标（单位：毫秒）
  // 使用辅助函数简化代码
  const getValue = (
    navKey: keyof PerformanceNavigationTiming,
    legacyKey: keyof PerformanceTiming,
  ): number => {
    if (navTiming && navKey in navTiming) {
      return (navTiming[navKey] as number) || 0;
    }
    if (legacyTiming && legacyKey in legacyTiming) {
      return (legacyTiming[legacyKey] as number) || 0;
    }
    return 0;
  };

  const metrics = {
    // DNS 查询时间
    dns:
      getValue("domainLookupEnd", "domainLookupEnd") -
      getValue("domainLookupStart", "domainLookupStart"),
    // TCP 连接时间
    tcp:
      getValue("connectEnd", "connectEnd") -
      getValue("connectStart", "connectStart"),
    // SSL 连接时间（如果有）
    ssl: (() => {
      const secureStart =
        navTiming?.secureConnectionStart ||
        legacyTiming?.secureConnectionStart ||
        0;
      if (secureStart > 0) {
        return getValue("connectEnd", "connectEnd") - secureStart;
      }
      return 0;
    })(),
    // TTFB（Time To First Byte）首字节时间
    ttfb:
      getValue("responseStart", "responseStart") -
      (navTiming
        ? getValue("requestStart", "requestStart")
        : legacyTiming?.navigationStart || 0),
    // 响应时间
    response:
      getValue("responseEnd", "responseEnd") -
      getValue("responseStart", "responseStart"),
    // DOM 解析时间
    domParse:
      getValue("domInteractive", "domInteractive") -
      getValue("responseEnd", "responseEnd"),
    // DOM 内容加载时间
    domContentLoaded:
      getValue("domContentLoadedEventEnd", "domContentLoadedEventEnd") -
      getValue("domContentLoadedEventStart", "domContentLoadedEventStart"),
    // DOM 加载完成时间
    domComplete:
      getValue("domComplete", "domComplete") -
      (navTiming
        ? getValue("domContentLoadedEventStart", "domContentLoadedEventStart")
        : legacyTiming?.domLoading || 0),
    // 页面加载总时间
    load:
      getValue("loadEventEnd", "loadEventEnd") -
      (navTiming
        ? getValue("fetchStart", "fetchStart")
        : legacyTiming?.navigationStart || 0),
    // 首次渲染时间（First Paint）
    firstPaint: 0,
    // 首次内容绘制时间（First Contentful Paint）
    firstContentfulPaint: 0,
    // 最大内容绘制时间（Largest Contentful Paint）
    lcp: 0,
    // 首次输入延迟（First Input Delay）
    fid: 0,
    // 累积布局偏移（Cumulative Layout Shift）
    cls: 0,
  };

  // 尝试获取 Paint Timing API 数据
  if (performance.getEntriesByType) {
    try {
      // 获取 Paint Timing 数据
      const paintEntries = performance.getEntriesByType(
        "paint",
      ) as PerformancePaintTiming[];
      paintEntries.forEach((entry) => {
        if (entry.name === "first-paint") {
          // 首次渲染时间
          metrics.firstPaint = Math.round(entry.startTime);
        } else if (entry.name === "first-contentful-paint") {
          // 首次内容绘制时间
          metrics.firstContentfulPaint = Math.round(entry.startTime);
        }
      });
    } catch (error) {
      // 捕获错误，不影响其他指标收集
      console.warn("Monitor: Failed to get paint timing", error);
    }
  }

  // 尝试获取 Web Vitals 指标
  if (performance.getEntriesByType) {
    try {
      // 获取 Largest Contentful Paint
      const lcpEntries = performance.getEntriesByType(
        "largest-contentful-paint",
      ) as PerformanceEntry[];
      if (lcpEntries.length > 0) {
        // 获取最后一个 LCP 条目（最准确的）
        const lastLcp = lcpEntries[lcpEntries.length - 1];
        if (lastLcp && "startTime" in lastLcp) {
          metrics.lcp = Math.round(lastLcp.startTime);
        }
      }
    } catch (error) {
      // 捕获错误
      console.warn("Monitor: Failed to get LCP", error);
    }
  }

  // 获取传输实例
  const transport = getTransport(); // 获取 transport 实例
  if (transport) {
    // 使用 transport 发送性能指标
    transport.send({
      type: "performance", // 事件类型
      metrics: metrics, // 性能指标
      url: window.location.href, // 当前页面 URL
      timestamp: new Date().toISOString(), // 时间戳
    });
  }
}

/**
 * 设置页面性能指标监控
 * @param options 监控配置选项
 */
export function setupPerformanceHandler(options: MonitorOptions): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return; // 不在浏览器环境或不支持 Performance API
  }

  // 等待页面加载完成后收集性能指标
  if (document.readyState === "complete") {
    // 页面已加载完成，立即收集
    collectPerformanceMetrics(options);
  } else {
    // 页面未加载完成，等待 load 事件
    window.addEventListener("load", () => {
      // 延迟收集，确保所有资源都已加载
      setTimeout(() => {
        collectPerformanceMetrics(options);
      }, 0);
    });
  }
}
