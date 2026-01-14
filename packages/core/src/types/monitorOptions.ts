// 监控配置选项接口
export interface MonitorOptions {
  dsn: string; // 监控数据上报地址
  apikey: string; // 项目标识
  userId?: string; // 用户ID（可选）
  silentXhr?: boolean; // 监控 XHR 请求
  silentFetch?: boolean; // 监控 Fetch 请求
  silentClick?: boolean; // 监控点击事件
  silentError?: boolean; // 监控错误事件
  silentUnhandledrejection?: boolean; // 监控未处理的 Promise 拒绝
  silentHashchange?: boolean; // 监控 hash 路由变化
  silentHistory?: boolean; // 监控 history 路由变化
  silentPerformance?: boolean; // 获取页面性能指标
  silentWhiteScreen?: boolean; // 开启白屏检测
  silentRecordScreen?: boolean; // 是否开启录屏功能
  recordScreentime?: number; // 录屏时间间隔（单位：秒，默认 10 秒）
  maxBreadcrumbs?: number; // 用户行为最大记录数
  xhrTimeoutThreshold?: number; // XHR 请求超时阈值（单位：毫秒，超过此时间将上报为慢请求
}

// 面包屑类型枚举 面包屑只记录用户行为 "xhr" | "fetch" | "click" | "router"
export type BreadcrumbType = "xhr" | "fetch" | "click" | "router";

// 错误 | 用户自定义上报行为
export type UserPost = "error" | "custom";

// 面包屑数据接口
export interface Breadcrumb {
  type: BreadcrumbType; // 面包屑类型
  message?: string; // 消息内容
  data?: Record<string, unknown>; // 附加数据
  timestamp: number; // 时间戳（毫秒）
  level?: "info" | "warning" | "error"; // 级别
}

export interface XhrInterface {
  method?: string; // 请求方法
  url?: string; // 请求 URL
  duration: number; // 请求耗时
  success: boolean; // 是否成功
  status?: number; // 响应状态码
  statusText?: string; // 响应状态文本
  error?: string; // 错误信息
}

export interface FetchInterface {
  method?: string; // 请求方法
  url?: string; // 请求 URL
  duration: number; // 请求耗时
  success: boolean; // 是否成功
  status?: number; // 响应状态码
  statusText?: string; // 响应状态文本
  error?: string; // 错误信息
}

export interface ClickInterface {
  tagName?: string; // 标签名
  id?: string; // 元素 ID
  className?: string; // 元素类名
  text?: string; // 元素文本内容
  x?: number; // 点击位置 X 坐标
  y?: number; // 点击位置 Y 坐标
  url?: string; // 当前页面 URL
}

export interface HashChangeInterface {
  from: string; // 变化前的 hash
  to: string; // 变化后的 hash
  url: string; // 当前完整 URL
}

export interface HistoryChangeInterface {
  from: string; // 变化前的 hash
  to: string; // 变化后的 hash
  url: string; // 当前完整 URL
  method: string; // 方法名（pushState、replaceState 或 popstate）
}
