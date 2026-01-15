// Vetur 配置文件
// 明确指定 TypeScript 配置文件，确保 Vetur 能正确识别 import.meta 等语法
// 注意：Vetur 对 Vue 3 的 <script setup> 支持有限，建议使用 Volar
module.exports = {
  // 指定项目使用的 TypeScript 配置文件
  projects: [
    {
      // 根目录路径（相对于此配置文件）
      root: "./",
      // TypeScript 配置文件路径
      tsconfig: "./tsconfig.app.json",
      // 启用 Vue 3 支持
      snippetFolder: "./.vscode/vetur/snippets",
      // 全局组件配置（如果需要）
      globalComponents: [],
    },
  ],
  // 启用实验性功能以支持 Vue 3
  experimental: {
    // 启用 template 插值服务
    templateInterpolationService: true,
  },
};
