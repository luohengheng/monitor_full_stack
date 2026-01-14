import { defineConfig } from "tsup"; // 导入 tsup 配置函数

// 因为我可以保证输出产物可以适配多种不同的模块化规范，commonjs、esm、umd
export default defineConfig([
  {
    entry: ["src"],
    format: ["cjs"],
    outDir: "build/cjs",
    dts: true,
  },
  {
    entry: ["src"],
    format: ["esm"],
    outDir: "build/esm",
    dts: false,
  },
  {
    entry: ["src"],
    format: ["iife"],
    outDir: "build/umd",
    name: "monitor-sdk-core",
    dts: false,
  },
]);
