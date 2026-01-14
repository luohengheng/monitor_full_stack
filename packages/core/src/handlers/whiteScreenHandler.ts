// 导入传输实例获取函数
import { getTransport } from "../baseClient";
import type { MonitorOptions } from "../types/monitorOptions";

/**
 * 判断颜色是否是白色
 * @param color 颜色值（可以是 rgb、rgba、hex 等格式）
 * @returns 是否是白色
 */
function isWhiteColor(color: string): boolean {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    return false; // 透明色不算白色
  }

  // 转换为小写
  const lowerColor = color.toLowerCase().trim(); // 转换为小写并去除空格

  // 检查是否是常见的白色值
  if (
    lowerColor === "white" ||
    lowerColor === "#fff" ||
    lowerColor === "#ffffff" ||
    lowerColor === "rgb(255, 255, 255)" ||
    lowerColor === "rgba(255, 255, 255, 1)" ||
    lowerColor.startsWith("rgba(255, 255, 255")
  ) {
    return true; // 是白色
  }

  // 尝试解析 RGB 值
  const rgbMatch = lowerColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); // 匹配 RGB 值
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parseInt(rgbMatch[1], 10); // 红色值
    const g = parseInt(rgbMatch[2], 10); // 绿色值
    const b = parseInt(rgbMatch[3], 10); // 蓝色值

    // 如果 RGB 值都接近 255（大于 240），认为是白色
    if (r > 240 && g > 240 && b > 240) {
      return true; // 是白色
    }
  }

  return false; // 不是白色
}

/**
 * 检测是否是骨架屏
 * @param body body 元素
 * @returns 是否是骨架屏
 */
function detectSkeletonScreen(body: HTMLElement): boolean {
  // 骨架屏的特征：
  // 1. 有特定的类名（如 skeleton、skeleton-screen、loading 等）
  // 2. 有灰色背景的占位元素
  // 3. 有动画效果（通常是闪烁动画）
  // 4. 有特定的数据属性

  // 检查是否有骨架屏相关的类名
  const skeletonClassNames = [
    "skeleton",
    "skeleton-screen",
    "skeleton-loading",
    "loading-skeleton",
    "shimmer",
    "shimmer-loading",
  ]; // 骨架屏相关的类名列表

  // 检查 body 或其子元素是否有这些类名
  for (const className of skeletonClassNames) {
    // 检查 body 本身
    if (body.classList.contains(className)) {
      return true; // 找到骨架屏类名
    }

    // 检查子元素
    if (body.querySelector(`.${className}`)) {
      return true; // 找到骨架屏元素
    }
  }

  // 检查是否有骨架屏相关的数据属性
  const skeletonDataAttrs = [
    "data-skeleton",
    "data-loading",
    "data-placeholder",
  ]; // 骨架屏相关的数据属性
  for (const attr of skeletonDataAttrs) {
    if (body.querySelector(`[${attr}]`)) {
      return true; // 找到骨架屏数据属性
    }
  }

  // 检查是否有灰色背景的占位元素（骨架屏通常使用灰色背景）
  const grayElements = body.querySelectorAll("*"); // 获取所有元素
  let grayElementCount = 0; // 灰色元素计数

  for (let i = 0; i < Math.min(grayElements.length, 20); i++) {
    // 只检查前 20 个元素，避免性能问题
    const element = grayElements[i] as HTMLElement; // 转换为 HTMLElement
    const style = window.getComputedStyle(element); // 获取计算样式
    const bgColor = style.backgroundColor; // 背景色

    // 检查是否是灰色（RGB 值接近，且在 200-240 之间）
    const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); // 匹配 RGB 值
    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
      const r = parseInt(rgbMatch[1], 10); // 红色值
      const g = parseInt(rgbMatch[2], 10); // 绿色值
      const b = parseInt(rgbMatch[3], 10); // 蓝色值

      // 判断是否是灰色（RGB 值接近，且在合理范围内）
      const isGray =
        Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 200 && r < 250; // 判断是否是灰色

      if (isGray) {
        grayElementCount++; // 增加计数
      }
    }
  }

  // 如果有多个灰色元素，可能是骨架屏
  if (grayElementCount >= 3) {
    return true; // 可能是骨架屏
  }

  // 检查是否有闪烁动画（骨架屏通常有闪烁效果）
  const styleSheets = document.styleSheets; // 获取所有样式表
  for (let i = 0; i < styleSheets.length; i++) {
    try {
      const sheet = styleSheets[i]; // 获取样式表
      if (!sheet) {
        continue; // 跳过空样式表
      }
      const rules = sheet.cssRules || sheet.rules; // 获取规则列表

      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j] as CSSRule; // 获取规则

        // 检查是否是动画规则
        if (
          rule instanceof CSSKeyframesRule ||
          rule instanceof CSSKeyframeRule
        ) {
          const ruleText = rule.cssText.toLowerCase(); // 获取规则文本

          // 检查是否包含骨架屏相关的动画名称
          if (
            ruleText.includes("skeleton") ||
            ruleText.includes("shimmer") ||
            ruleText.includes("loading") ||
            ruleText.includes("pulse")
          ) {
            return true; // 找到骨架屏动画
          }
        }
      }
    } catch {
      // 跨域样式表可能无法访问，忽略错误
      continue;
    }
  }

  return false; // 不是骨架屏
}

/**
 * 检测白屏
 * @param options 监控配置选项
 */
function detectWhiteScreen(options: MonitorOptions): void {
  // 检查配置是否允许监控白屏
  if (options.silentWhiteScreen) {
    return; // 如果配置为静默，则不监控
  }

  // 获取视口尺寸
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth; // 视口宽度
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight; // 视口高度

  // 获取 body 元素
  const body = document.body; // 获取 body 元素
  if (!body) {
    return; // 没有 body 元素，无法检测
  }

  // 获取 body 的计算样式
  const bodyStyle = window.getComputedStyle(body); // 获取计算样式
  const bodyBgColor = bodyStyle.backgroundColor; // 背景色

  // 判断是否是白色背景
  const isWhiteBackground = isWhiteColor(bodyBgColor); // 判断是否是白色

  // 检查页面元素数量
  const elementCount = body.querySelectorAll("*").length; // 获取所有元素数量

  // 检查是否有文本内容
  const hasTextContent = body.textContent && body.textContent.trim().length > 0; // 是否有文本内容

  // 检查是否有图片
  const hasImages = body.querySelectorAll("img").length > 0; // 是否有图片

  // 检查是否是骨架屏
  const isSkeleton = detectSkeletonScreen(body); // 检测是否是骨架屏

  // 判断是否是白屏
  // 白屏条件：白色背景 + (元素数量少 或 没有文本内容 或 没有图片) + 不是骨架屏
  const isWhiteScreen =
    isWhiteBackground && // 白色背景
    (elementCount < 10 || !hasTextContent || !hasImages) && // 元素少或没有内容
    !isSkeleton; // 不是骨架屏

  // 如果检测到白屏，上报
  if (isWhiteScreen) {
    // 获取传输实例
    const transport = getTransport(); // 获取 transport 实例
    if (transport) {
      // 使用 transport 发送白屏信息
      transport.send({
        type: "white-screen", // 事件类型
        isWhiteScreen: true, // 是否白屏
        isSkeleton: isSkeleton, // 是否是骨架屏
        viewportWidth: viewportWidth, // 视口宽度
        viewportHeight: viewportHeight, // 视口高度
        elementCount: elementCount, // 元素数量
        hasTextContent: hasTextContent, // 是否有文本内容
        hasImages: hasImages, // 是否有图片
        backgroundColor: bodyBgColor, // 背景色
        url: window.location.href, // 当前页面 URL
        timestamp: new Date().toISOString(), // 时间戳
      });
    }
  }
}

/**
 * 设置白屏检测
 * @param options 监控配置选项
 */
export function setupWhiteScreenHandler(options: MonitorOptions): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined" || typeof document === "undefined") {
    return; // 不在浏览器环境
  }

  // 等待页面加载完成后进行检测
  if (document.readyState === "complete") {
    // 页面已加载完成，延迟检测
    setTimeout(() => {
      detectWhiteScreen(options);
    }, 2000); // 延迟 2 秒检测，给页面渲染时间
  } else {
    // 页面未加载完成，等待 load 事件
    window.addEventListener("load", () => {
      // 延迟检测
      setTimeout(() => {
        detectWhiteScreen(options);
      }, 2000); // 延迟 2 秒检测
    });
  }
}
