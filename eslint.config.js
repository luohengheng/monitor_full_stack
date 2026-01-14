import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPrettier from "eslint-plugin-prettier";
import importSort from "eslint-plugin-simple-import-sort";

import tseslint from "typescript-eslint";

const ignores = [
  "dist",
  "build",
  "**/*.js",
  "**/*.mjs",
  "**/*.d.ts",
  "eslint.config.js",
  "commitlint.config.js",
  "apps/frontend/monitor/src/components/ui/**/*",
  "packages/browser-utils/src/metrics/**/*",
];

const packagesConfig = {
  files: ["packages/**/*.{ts,tsx}"],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
    parser: tseslint.parser, // 使用 TypeScript ESLint 解析器
    parserOptions: {
      tsconfigRootDir: import.meta.dirname, // 设置 TypeScript 配置根目录
    },
  },
  rules: {
    "no-console": "off", // error
  },
};

const frontendConfig = {
  files: ["apps/frontend/monitor/**/*.{ts,tsx}"],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "no-console": "error",
  },
};

const backendConfig = {
  files: ["apps/backend/**/*.ts"],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parser: tseslint.parser,
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "error",
  },
};

// Demos 配置（Vue3 和 React18 演示项目）
const demosConfig = {
  files: ["demos/**/*.{ts,tsx,vue}"],
  languageOptions: {
    globals: {
      ...globals.browser, // 浏览器全局对象
    },
    parser: tseslint.parser, // 使用 TypeScript ESLint 解析器
    parserOptions: {
      tsconfigRootDir: import.meta.dirname, // 设置 TypeScript 配置根目录
      project: [
        "./demos/*/tsconfig.app.json", // 应用代码的 TypeScript 配置
        "./demos/*/tsconfig.node.json", // 配置文件（如 vite.config.ts）的 TypeScript 配置
      ],
    },
  },
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules, // React Hooks 规则
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ], // React Refresh 规则
    "no-console": "off", // 允许 console（演示项目需要）
    "@typescript-eslint/no-unsafe-assignment": "off", // 关闭不安全的赋值检查
    "@typescript-eslint/no-unsafe-member-access": "off", // 关闭不安全的成员访问检查
    "@typescript-eslint/no-unsafe-call": "off", // 关闭不安全的调用检查
  },
};

export default tseslint.config(
  {
    ignores,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      prettier: eslintPrettier,
      "simple-import-sort": importSort,
    },
    rules: {
      "prettier/prettier": "error",
      "simple-import-sort/imports": "error",
    },
  },
  packagesConfig,
  frontendConfig,
  backendConfig,
  demosConfig,
);
