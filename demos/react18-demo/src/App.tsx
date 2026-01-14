import "./App.css"; // 导入样式文件

import type { MonitorOptions } from "@monitor_full_stack/react_monitor"; // 从 react_monitor 包导入类型定义
import { Component, useState } from "react"; // 导入 React 的 Component 和 useState Hook

// 测试 React 生命周期错误的组件
// 这个组件会在 componentDidMount 生命周期方法中抛出错误
class LifecycleErrorComponent extends Component {
  // 组件挂载后立即抛出错误
  componentDidMount(): void {
    // 在生命周期方法中抛出错误，用于测试 ErrorBoundary 是否能正确捕获
    throw new Error("这是一个 React 生命周期错误 - componentDidMount 中抛出");
  }

  // 渲染方法
  render() {
    // 这个组件永远不会正常渲染，因为 componentDidMount 会抛出错误
    return <div>这个组件会在挂载时抛出错误</div>;
  }
}

function App({ monitorConfig }: { monitorConfig: MonitorOptions }) {
  // 用于控制是否渲染生命周期错误组件
  const [showLifecycleError, setShowLifecycleError] = useState(false); // 生命周期错误组件显示状态
  /**
   * 测试 JavaScript 错误
   */
  const testError = (): void => {
    // 抛出一个测试错误
    throw new Error("这是一个测试错误 - React 监控测试");
  };

  /**
   * 测试未处理的 Promise 拒绝
   */
  const testUnhandledRejection = (): void => {
    // 创建一个会被拒绝的 Promise
    Promise.reject(new Error("这是一个未处理的 Promise 拒绝测试"));
  };

  /**
   * 测试 XHR 请求
   */
  const testXhr = (): void => {
    // 创建一个 XMLHttpRequest 请求
    const xhr = new XMLHttpRequest(); // 创建 XHR 实例
    xhr.open("GET", "https://example.com/api/monitor"); // 配置请求方法和 URL
    xhr.send(); // 发送请求
  };

  /**
   * 测试 Fetch 请求
   */
  const testFetch = async (): Promise<void> => {
    // 使用 Fetch API 发送请求
    await fetch("https://jsonplaceholder.typicode.com/posts/1");
  };

  /**
   * 测试慢请求（超过超时阈值）
   */
  const testSlowRequest = (): void => {
    // 创建一个会延迟响应的请求
    const xhr = new XMLHttpRequest(); // 创建 XHR 实例
    xhr.open("GET", "https://httpbin.org/delay/6"); // 请求延迟 6 秒（超过 5 秒阈值）
    xhr.send(); // 发送请求
  };

  /**
   * 测试 Hash 路由变化
   */
  const testHashChange = (): void => {
    // 改变 hash 路由
    window.location.hash = `#test-${Date.now()}`; // 设置新的 hash 值
  };

  /**
   * 测试 History 路由变化
   */
  const testHistoryChange = (): void => {
    // 使用 history.pushState 改变路由
    const newUrl = `${window.location.pathname}?test=${Date.now()}`; // 构建新的 URL
    window.history.pushState({}, "", newUrl); // 推送新的历史记录
  };

  /**
   * 测试点击事件（点击按钮本身就会触发）
   */
  const testClick = (): void => {
    // 点击事件会在按钮点击时自动触发，这里只是提示
    console.log("点击事件测试 - 这个点击会被监控记录");
  };

  /**
   * 测试 React 生命周期错误
   */
  const testLifecycleError = (): void => {
    // 设置状态为 true，触发渲染生命周期错误组件
    setShowLifecycleError(true);
  };

  return (
    <div className="container">
      {/* 监控配置展示区域 */}
      <div className="config-section">
        <h2>监控配置项</h2>
        <div className="config-grid">
          <div className="config-item">
            <span className="config-label">DSN:</span>
            <span className="config-value">{monitorConfig.dsn}</span>
          </div>
          <div className="config-item">
            <span className="config-label">API Key:</span>
            <span className="config-value">{monitorConfig.apikey}</span>
          </div>
          <div className="config-item">
            <span className="config-label">User ID:</span>
            <span className="config-value">{monitorConfig.userId}</span>
          </div>
          <div className="config-item">
            <span className="config-label">录屏时间间隔:</span>
            <span className="config-value">
              {monitorConfig.recordScreentime}秒
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">最大面包屑数:</span>
            <span className="config-value">{monitorConfig.maxBreadcrumbs}</span>
          </div>
          <div className="config-item">
            <span className="config-label">XHR 超时阈值:</span>
            <span className="config-value">
              {monitorConfig.xhrTimeoutThreshold}ms
            </span>
          </div>
        </div>
      </div>

      {/* 测试按钮区域 */}
      <div className="test-section">
        <h2>监控功能测试</h2>
        <div className="test-buttons">
          <button className="test-btn error" onClick={testError}>
            测试 JavaScript 错误
          </button>
          <button
            className="test-btn rejection"
            onClick={testUnhandledRejection}
          >
            测试 Promise 拒绝
          </button>
          <button className="test-btn xhr" onClick={testXhr}>
            测试 XHR 请求
          </button>
          <button className="test-btn fetch" onClick={testFetch}>
            测试 Fetch 请求
          </button>
          <button className="test-btn slow" onClick={testSlowRequest}>
            测试慢请求（超时）
          </button>
          <button className="test-btn hash" onClick={testHashChange}>
            测试 Hash 路由变化
          </button>
          <button className="test-btn history" onClick={testHistoryChange}>
            测试 History 路由变化
          </button>
          <button className="test-btn click" onClick={testClick}>
            测试点击事件
          </button>
          <button className="test-btn lifecycle" onClick={testLifecycleError}>
            测试 React 生命周期错误
          </button>
        </div>
      </div>

      {/* 生命周期错误组件渲染区域 */}
      {/* 当 showLifecycleError 为 true 时，渲染生命周期错误组件 */}
      {showLifecycleError && <LifecycleErrorComponent />}
    </div>
  );
}

export default App;
