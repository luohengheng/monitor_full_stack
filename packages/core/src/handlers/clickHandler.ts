// 导入面包屑管理器
import type { BreadcrumbManager } from "../breadcrumb";
import type { ClickInterface, MonitorOptions } from "../types/monitorOptions";

// 存储点击事件监听器引用，用于避免重复注册
let clickEventListener: ((event: Event) => void) | null = null;

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 300;

/**
 * 上报点击事件信息
 * @param info 点击信息
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
function reportClickEvent(
  info: ClickInterface,
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查配置是否允许监控点击事件
  if (options.silentClick) {
    return; // 如果配置为静默，则不监控
  }

  // 构建消息内容
  const message = `${info.tagName || "element"}${info.id ? `#${info.id}` : ""}${info.className ? `.${info.className.split(" ")[0]}` : ""}`; // 构建消息

  // 添加面包屑记录（点击事件只记录到面包屑，不单独上报）
  breadcrumbManager.addBreadcrumb(
    "click", // 面包屑类型
    message, // 消息内容
    {
      tagName: info.tagName, // 标签名
      id: info.id, // 元素 ID
      className: info.className, // 元素类名
      x: info.x, // 点击位置 X 坐标
      y: info.y, // 点击位置 Y 坐标
      text: info.text, // 元素文本内容
      url: info.url, // 当前页面 URL
    },
    "info", // 级别
  );
}

/**
 * 检查元素是否应该被监控
 * @param target 目标元素
 * @returns 是否应该监控
 */
function shouldMonitorElement(target: HTMLElement | null): boolean {
  if (!target) {
    return false; // 没有目标元素，不监控
  }

  // 检查是否是监控SDK相关的元素（避免监控SDK自己的元素）
  const monitorSelectors = ["[data-monitor-ignore]", ".monitor-ignore"]; // 监控忽略选择器
  for (const selector of monitorSelectors) {
    if (target.matches(selector) || target.closest(selector)) {
      return false; // 匹配忽略选择器，不监控
    }
  }

  return true;
}

/**
 * 设置点击事件监控
 * @param options 监控配置选项
 * @param breadcrumbManager 面包屑管理器
 */
export function setupClickHandler(
  options: MonitorOptions,
  breadcrumbManager: BreadcrumbManager,
): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined" || typeof document === "undefined") {
    return; // 不在浏览器环境
  }

  // 如果已经注册过监听器，先移除旧的监听器，避免重复注册
  if (clickEventListener) {
    document.removeEventListener("click", clickEventListener, true);
    clickEventListener = null;
  }

  // 创建点击事件处理函数
  clickEventListener = (event: Event) => {
    // 检查配置是否允许监控点击事件
    if (options.silentClick) {
      return;
    }

    // 获取点击目标元素
    const target = event.target as HTMLElement | null;

    // 检查是否应该监控该元素
    if (!shouldMonitorElement(target)) {
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // 使用防抖机制，避免频繁上报
    debounceTimer = setTimeout(() => {
      // 收集点击信息
      const clickInfo: ClickInterface = {};

      if (target) {
        // 记录元素信息
        clickInfo.tagName = target.tagName.toLowerCase(); // 标签名（小写）
        clickInfo.id = target.id || undefined; // 元素 ID
        clickInfo.className =
          target.className && typeof target.className === "string"
            ? target.className
            : undefined; // 元素类名

        // 获取元素文本内容（截取前 100 个字符）
        const textContent = target.textContent || target.innerText || ""; // 获取文本内容
        clickInfo.text = textContent.slice(0, 100); // 截取前 100 个字符

        // 如果是链接元素，记录 href
        if (target.tagName.toLowerCase() === "a") {
          const link = target as HTMLAnchorElement; // 转换为链接元素
          clickInfo.url = link.href || undefined; // 记录链接地址
        }
      }

      // 记录点击位置
      if (event instanceof MouseEvent) {
        clickInfo.x = event.clientX; // X 坐标
        clickInfo.y = event.clientY; // Y 坐标
      }

      // 记录当前页面 URL
      clickInfo.url = clickInfo.url || window.location.href; // 当前页面 URL

      // 上报点击信息
      reportClickEvent(clickInfo, options, breadcrumbManager);

      // 清空定时器引用
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  };

  // 监听全局点击事件（使用捕获阶段，确保能捕获所有点击事件）
  document.addEventListener("click", clickEventListener, true);
}
