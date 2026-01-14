export { Monitor } from "./monitor";
// 导出传输相关函数
export { getTransport } from "./baseClient";
// 导出录屏相关函数
export { markError } from "./handlers/recordScreenHandler";
// 导出面包屑管理器
export { BreadcrumbManager } from "./breadcrumb";
// 导出类型定义
export type {
  MonitorOptions,
  Breadcrumb,
  BreadcrumbType,
} from "./types/monitorOptions";

// 导出默认 Monitor 类
import { Monitor } from "./monitor";
export default Monitor;
