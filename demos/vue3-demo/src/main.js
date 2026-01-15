import "./style.css";
import monitorPlugin from "@monitor_full_stack/vue_monitor";
import { createApp } from "vue";
import App from "./App.vue";
const app = createApp(App);
// 定义监控配置对象
const monitorConfig = {
  dsn: import.meta.env.VITE_MONITOR_DSN || "",
  apikey: import.meta.env.VITE_MONITOR_API_KEY || "",
  userId: import.meta.env.VITE_MONITOR_USER_ID || "",
  silentXhr: false,
  silentFetch: false,
  silentClick: false,
  silentError: false,
  silentUnhandledrejection: false,
  silentHashchange: false,
  silentHistory: false,
  silentPerformance: false,
  silentWhiteScreen: false,
  silentRecordScreen: false,
  recordScreentime: 10,
  maxBreadcrumbs: 50,
  xhrTimeoutThreshold: 5000,
};
app.use(monitorPlugin, monitorConfig);
app.provide("monitorConfig", monitorConfig); // 在应用级别提供监控配置，供子组件使用
app.mount("#app");
//# sourceMappingURL=main.js.map
