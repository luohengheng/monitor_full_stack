import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 配置环境变量文件目录，指向项目根目录
  // 这样可以从最外层读取 .env 文件
  envDir: resolve(__dirname, "../../"),
  // 环境变量前缀，只有以 VITE_ 开头的变量才会暴露给客户端
  envPrefix: "VITE_",
});
