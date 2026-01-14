import { BreadcrumbManager } from "../breadcrumb";
import type {
  HashChangeInterface,
  HistoryChangeInterface,
  MonitorOptions,
} from "../types/monitorOptions";

/**
 * 上报 hash 路由变化信息
 * @param info 路由变化信息
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
function reportHashchange(
  info: HashChangeInterface,
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查配置是否允许监控 hash 路由变化
  if (options.silentHashchange) {
    return; // 如果配置为静默，则不监控
  }

  // 添加面包屑记录
  breadcrumbManager.addBreadcrumb(
    "router",
    `router_${info.from} -> ${info.to}`,
    {
      from: info.from,
      to: info.to,
      url: info.url,
    },
    "info",
  );
}

/**
 * 上报 history 路由变化信息
 * @param info 路由变化信息
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
function reportHistoryChange(
  info: HistoryChangeInterface,
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查配置是否允许监控 history 路由变化
  if (options.silentHistory) {
    return;
  }

  // 添加面包屑记录
  breadcrumbManager.addBreadcrumb(
    "router",
    `router_${info.method}_${info.from} -> ${info.to}`,
    {
      method: info.method,
      from: info.from,
      to: info.to,
      url: info.url,
    },
    "info",
  );
}

/**
 * 设置 hash 路由变化监控
 * @param options 监控配置选项
 */
export function setupHashchangeHandler(
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return; // 不在浏览器环境
  }

  // 记录初始 hash 值
  let lastHash = window.location.hash; // 记录上一次的 hash 值

  // 监听 hashchange 事件
  window.addEventListener("hashchange", () => {
    // 检查配置是否允许监控 hash 路由变化
    if (options.silentHashchange) {
      return; // 如果配置为静默，则不监控
    }

    // 获取当前 hash 值
    const currentHash = window.location.hash; // 当前 hash 值
    const currentUrl = window.location.href; // 当前完整 URL

    // 上报 hash 变化信息
    reportHashchange(
      {
        from: lastHash, // 变化前的 hash
        to: currentHash, // 变化后的 hash
        url: currentUrl, // 当前完整 URL
      },
      options,
      breadcrumbManager,
    );

    // 更新记录的 hash 值
    lastHash = currentHash; // 更新为当前 hash
  });

  // 初始上报（如果存在 hash）
  if (lastHash) {
    // 延迟上报，确保 transport 已初始化
    setTimeout(() => {
      // 检查配置是否允许监控 hash 路由变化
      if (!options.silentHashchange) {
        // 上报初始 hash
        reportHashchange(
          {
            from: "", // 初始状态，没有 from
            to: lastHash, // 初始 hash 值
            url: window.location.href, // 当前完整 URL
          },
          options,
          breadcrumbManager,
        );
      }
    }, 0);
  }
}

/**
 * 设置 history 路由变化监控
 * @param options 监控配置选项
 */
export function setupHistoryHandler(
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined" || !window.history) {
    return; // 不在浏览器环境或不支持 history API
  }

  // 保存原始的 pushState 和 replaceState 方法
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // 记录当前 URL
  let currentUrl = window.location.href;

  // 重写 pushState 方法
  window.history.pushState = function (
    state: unknown,
    title: string,
    url?: string | URL | null,
  ) {
    // 构建新的 URL
    const newUrl = url
      ? typeof url === "string"
        ? new URL(url, window.location.href).href
        : url.href
      : window.location.href; // 如果没有提供 URL，使用当前 URL

    // 调用原始的 pushState 方法
    const result = originalPushState.call(this, state, title, url ?? null);

    // 上报路由变化
    reportHistoryChange(
      {
        from: currentUrl,
        to: newUrl,
        url: newUrl,
        method: "pushState",
      },
      options,
      breadcrumbManager,
    );

    // 更新当前 URL
    currentUrl = newUrl; // 更新为新的 URL

    // 返回结果
    return result;
  };

  // 重写 replaceState 方法
  window.history.replaceState = function (
    state: unknown,
    title: string,
    url?: string | URL | null,
  ) {
    // 构建新的 URL
    const newUrl = url
      ? typeof url === "string"
        ? new URL(url, window.location.href).href
        : url.href
      : window.location.href; // 如果没有提供 URL，使用当前 URL

    // 调用原始的 replaceState 方法
    const result = originalReplaceState.call(this, state, title, url ?? null);

    // 上报路由变化
    reportHistoryChange(
      {
        from: currentUrl,
        to: newUrl,
        url: newUrl,
        method: "replaceState",
      },
      options,
      breadcrumbManager,
    );

    // 更新当前 URL
    currentUrl = newUrl; // 更新为新的 URL

    // 返回结果
    return result;
  };

  // 监听 popstate 事件（浏览器前进/后退）
  window.addEventListener("popstate", () => {
    // 检查配置是否允许监控 history 路由变化
    if (options.silentHistory) {
      return; // 如果配置为静默，则不监控
    }

    // 获取当前 URL
    const newUrl = window.location.href; // 当前 URL

    // 上报路由变化
    reportHistoryChange(
      {
        from: currentUrl,
        to: newUrl,
        url: newUrl,
        method: "popstate",
      },
      options,
      breadcrumbManager,
    );

    // 更新当前 URL
    currentUrl = newUrl; // 更新为新的 URL
  });
}
