/// <reference types="vite/client" /> // Vite 客户端类型引用

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
