import { getTransport } from "../baseClient";
import type { MonitorOptions } from "../types/monitorOptions";

/**
 * 性能指标阈值配置与判断依据
 * 仅当任一指标超过阈值时上报，用于发现「需要关注的性能问题」
 *
 * | 指标 | 阈值 | 判断依据 |
 * |------|------|----------|
 * | LCP  | > 2500ms | Google Web Vitals：LCP ≤2.5s 为 Good，>2.5s 需关注 |
 * | FCP  | > 1800ms | Google Web Vitals：FCP ≤1.8s 为 Good，>1.8s 需关注 |
 * | TTFB | > 800ms  | Google / Chrome：TTFB ≤800ms 为 Good，>800ms 影响 LCP |
 * | Load | > 5000ms | 常见实践：整页加载 >5s 视为慢页 |
 * | DOM ContentLoaded | > 3000ms | 白屏/可交互延迟：DCL >3s 用户感知明显 |
 * | DNS  | > 500ms  | 网络层异常：DNS 通常 <200ms，>500ms 视为异常 |
 * | TCP  | > 1000ms | 连接建立过慢：TCP >1s 可能网络或服务端问题 |
 * | FID  | > 100ms  | Google Web Vitals：FID ≤100ms 为 Good，>100ms 可感知卡顿 |
 * | CLS  | > 0.1    | Google Web Vitals：CLS ≤0.1 为 Good，>0.1 明显布局跳动 |
 * | Resource | > 3000ms | 单资源加载时长 >3s 视为慢资源，可能阻塞渲染或首屏 |
 */
const PERFORMANCE_THRESHOLDS = {
  /** LCP：最大内容绘制，核心 Web Vital，>2.5s 需上报 */
  lcp: 2500,
  /** FCP：首次内容绘制，>1.8s 需上报 */
  firstContentfulPaint: 1800,
  /** TTFB：首字节时间，>800ms 需上报 */
  ttfb: 800,
  /** 页面 load 事件总耗时，>5s 需上报 */
  load: 5000,
  /** DOM ContentLoaded 耗时，>3s 需上报 */
  domContentLoaded: 3000,
  /** DNS 查询时间，>500ms 需上报 */
  dns: 500,
  /** TCP 连接时间，>1000ms 需上报 */
  tcp: 1000,
  /** FID：首次输入延迟，>100ms 需上报（单位 ms） */
  fid: 100,
  /** CLS：累积布局偏移，>0.1 需上报（无单位） */
  cls: 0.1,
  /** 单资源加载时长，>3s 视为慢资源需上报（单位 ms） */
  resourceDuration: 3000,
} as const;

/** 性能指标对象结构（用于阈值判断） */
interface PerformanceMetricsMap {
  dns: number;
  tcp: number;
  ssl: number;
  ttfb: number;
  response: number;
  domParse: number;
  domContentLoaded: number;
  domComplete: number;
  load: number;
  firstPaint: number;
  firstContentfulPaint: number;
  lcp: number;
  fid: number;
  cls: number;
}

/**
 * 根据阈值判断当前性能是否需要上报，并返回触发原因
 * @param metrics 性能指标（单位：ms，cls 无单位）
 * @returns 是否上报 + 触发的条件描述列表
 */
function shouldReportPerformance(metrics: PerformanceMetricsMap): {
  shouldReport: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (metrics.lcp > 0 && metrics.lcp > PERFORMANCE_THRESHOLDS.lcp) {
    reasons.push(
      `LCP=${metrics.lcp}ms>${PERFORMANCE_THRESHOLDS.lcp}ms(Web Vitals 需关注)`,
    );
  }
  if (
    metrics.firstContentfulPaint > 0 &&
    metrics.firstContentfulPaint > PERFORMANCE_THRESHOLDS.firstContentfulPaint
  ) {
    reasons.push(
      `FCP=${metrics.firstContentfulPaint}ms>${PERFORMANCE_THRESHOLDS.firstContentfulPaint}ms(Web Vitals 需关注)`,
    );
  }
  if (metrics.ttfb > PERFORMANCE_THRESHOLDS.ttfb) {
    reasons.push(
      `TTFB=${metrics.ttfb}ms>${PERFORMANCE_THRESHOLDS.ttfb}ms(首字节过慢)`,
    );
  }
  if (metrics.load > 0 && metrics.load > PERFORMANCE_THRESHOLDS.load) {
    reasons.push(
      `Load=${metrics.load}ms>${PERFORMANCE_THRESHOLDS.load}ms(整页加载过慢)`,
    );
  }
  if (
    metrics.domContentLoaded > 0 &&
    metrics.domContentLoaded > PERFORMANCE_THRESHOLDS.domContentLoaded
  ) {
    reasons.push(
      `DOMContentLoaded=${metrics.domContentLoaded}ms>${PERFORMANCE_THRESHOLDS.domContentLoaded}ms(可交互延迟)`,
    );
  }
  if (metrics.dns > PERFORMANCE_THRESHOLDS.dns) {
    reasons.push(
      `DNS=${metrics.dns}ms>${PERFORMANCE_THRESHOLDS.dns}ms(解析异常)`,
    );
  }
  if (metrics.tcp > PERFORMANCE_THRESHOLDS.tcp) {
    reasons.push(
      `TCP=${metrics.tcp}ms>${PERFORMANCE_THRESHOLDS.tcp}ms(连接过慢)`,
    );
  }
  if (metrics.fid > 0 && metrics.fid > PERFORMANCE_THRESHOLDS.fid) {
    reasons.push(
      `FID=${metrics.fid}ms>${PERFORMANCE_THRESHOLDS.fid}ms(输入延迟)`,
    );
  }
  if (metrics.cls > 0 && metrics.cls > PERFORMANCE_THRESHOLDS.cls) {
    reasons.push(`CLS=${metrics.cls}>${PERFORMANCE_THRESHOLDS.cls}(布局偏移)`);
  }

  return {
    shouldReport: reasons.length > 0,
    reasons,
  };
}

/** 单条资源记录（用于慢资源判断与上报） */
interface ResourceEntry {
  name: string;
  initiatorType: string;
  duration: number;
  startTime: number;
  size?: number;
}

/**
 * 从资源列表中筛出加载过慢的资源，并生成上报原因
 * 判断依据：单资源 duration > resourceDuration 阈值（默认 3s），可能阻塞首屏或主流程
 * @param resources 当前页所有资源
 * @returns 慢资源列表 + 对应 reason 列表
 */
function getSlowResourceReasons(resources: ResourceEntry[]): {
  slowResources: ResourceEntry[];
  reasons: string[];
} {
  const slowResources = resources.filter(
    (r) => r.duration > PERFORMANCE_THRESHOLDS.resourceDuration,
  );
  const reasons = slowResources.map(
    (r) =>
      `Resource slow: ${r.name} type=${r.initiatorType} duration=${r.duration}ms>${PERFORMANCE_THRESHOLDS.resourceDuration}ms`,
  );
  return { slowResources, reasons };
}

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

  // 收集所有资源加载耗时（script、link、img、fetch、xhr 等）
  let resources: Array<{
    name: string;
    initiatorType: string;
    duration: number;
    startTime: number;
    size?: number;
  }> = [];
  if (performance.getEntriesByType) {
    try {
      const resourceEntries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      resources = resourceEntries.map((entry) => {
        const item: {
          name: string;
          initiatorType: string;
          duration: number;
          startTime: number;
          size?: number;
        } = {
          name: entry.name,
          initiatorType: entry.initiatorType,
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
        };
        // transferSize 需跨域且服务器返回 Timing-Allow-Origin 才有值
        if (
          "transferSize" in entry &&
          typeof (entry as PerformanceResourceTiming).transferSize === "number"
        ) {
          const size = (entry as PerformanceResourceTiming).transferSize;
          if (size > 0) item.size = size;
        }
        return item;
      });
    } catch (error) {
      console.warn("Monitor: Failed to get resource entries", error);
    }
  }

  // 根据阈值判断是否需要上报（仅「出问题」时上报）
  const { shouldReport, reasons } = shouldReportPerformance(metrics);
  const { slowResources, reasons: slowReasons } =
    getSlowResourceReasons(resources);
  const hasSlowResources = slowResources.length > 0;
  const allReasons = hasSlowResources ? [...reasons, ...slowReasons] : reasons;
  const needReport = shouldReport || hasSlowResources;

  const transport = getTransport();
  if (transport && needReport) {
    transport.send({
      type: "performance",
      metrics,
      resources,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      /** 本次上报的触发条件，便于排查 */
      reportReasons: allReasons,
      /** 加载过慢的资源列表（duration > 阈值），便于定位慢请求 */
      slowResources: hasSlowResources ? slowResources : undefined,
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
