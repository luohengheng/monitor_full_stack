import { defineConfig } from "tsup"; // 导入 tsup 配置函数

// 因为我可以保证输出产物可以适配多种不同的模块化规范，commonjs、esm、umd
export default defineConfig([
  {
    entry: ["src"], // 入口文件
    format: ["cjs"], // CommonJS 格式
    outDir: "build/cjs", // 输出目录
    dts: false, // 不在 CJS 构建中生成类型文件
  },
  {
    entry: ["src"], // 入口文件
    format: ["esm"], // ES Module 格式
    outDir: "build/esm", // 输出目录
    dts: false, // 不在 ESM 构建中生成类型文件
  },
  {
    entry: ["src"], // 入口文件
    format: ["iife"], // IIFE 格式（立即执行函数表达式）
    outDir: "build/umd", // 输出目录
    name: "monitor-sdk-core", // 全局变量名
    dts: false, // 不在 UMD 构建中生成类型文件
  },
  {
    entry: ["src"], // 入口文件
    format: ["cjs"], // 使用 CJS 格式生成类型文件（会生成 .d.ts 而不是 .d.mts）
    outDir: "build/types", // 类型文件输出目录
    dts: {
      only: true, // 只生成类型文件，不生成 JS 文件
    },
  },
]);
