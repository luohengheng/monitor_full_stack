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

export {}; // 使文件成为模块
