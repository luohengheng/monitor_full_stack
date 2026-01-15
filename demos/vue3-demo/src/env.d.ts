/// <reference types="vite/client" /> // Vite 客户端类型引用
/// <reference lib="dom" /> // DOM 类型库引用

// 声明全局 DOM 类型（确保 Vue SFC 文件可以识别浏览器全局对象）
// 通过 triple-slash directive 引入 DOM 类型库，所有浏览器全局对象（XMLHttpRequest、window 等）都会自动可用
// 无需额外声明，reference lib="dom" 已经包含了所有必要的类型定义

// 声明 Vue 单文件组件模块类型
declare module "*.vue" {
  // 导入 Vue 的 DefineComponent 类型
  import type { DefineComponent } from "vue";
  // 定义组件类型为 DefineComponent，接受任意属性
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  // 导出组件
  export default component;
}

// 声明 Vite 环境变量类型
// 只有以 VITE_ 开头的环境变量才会暴露给客户端代码
interface ImportMetaEnv {
  // 客户端可访问的监控数据上报地址
  readonly VITE_MONITOR_DSN?: string;
  // 客户端可访问的项目标识
  readonly VITE_MONITOR_API_KEY?: string;
  // 客户端可访问的用户ID
  readonly VITE_MONITOR_USER_ID?: string;
}

// 扩展 ImportMeta 接口，添加 env 属性
interface ImportMeta {
  // 环境变量对象
  readonly env: ImportMetaEnv;
}

export {}; // 使文件成为模块
