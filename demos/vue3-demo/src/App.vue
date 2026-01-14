<script setup lang="ts">
import { inject, ref } from 'vue' // 导入 Vue 的 inject API 和响应式 API
import LifecycleTestComponent from './components/LifecycleTestComponent.vue' // 导入生命周期测试组件

// 定义监控配置的默认值（作为 fallback）
const defaultMonitorConfig = {
  dsn: 'https://example.com/api/monitor', // 监控数据上报地址
  apikey: 'test-api-key', // 项目标识
  userId: 'test-user-123', // 用户ID
  silentXhr: false, // 是否监控 XHR 请求
  silentFetch: false, // 是否监控 Fetch 请求
  silentClick: false, // 是否监控点击事件
  silentError: false, // 是否监控错误事件
  silentUnhandledrejection: false, // 是否监控未处理的 Promise 拒绝
  silentHashchange: false, // 是否监控 hash 路由变化
  silentHistory: false, // 是否监控 history 路由变化
  silentPerformance: false, // 是否获取页面性能指标
  silentWhiteScreen: false, // 是否开启白屏检测
  silentRecordScreen: false, // 是否开启录屏功能
  recordScreentime: 10, // 录屏时间间隔（单位：秒）
  maxBreadcrumbs: 50, // 用户行为最大记录数
  xhrTimeoutThreshold: 5000 // XHR 请求超时阈值（单位：毫秒）
}

// 从父组件注入监控配置，如果未提供则使用默认值
const monitorConfig = inject('monitorConfig', {})

// 用于控制子组件显示/隐藏的响应式变量
const showLifecycleComponent = ref(false) // 控制生命周期测试组件显示状态
const updateTrigger = ref(0) // 用于触发组件更新的计数器
const lifecycleErrorType = ref<string>('mounted') // 当前生命周期错误类型

/**
 * 测试 JavaScript 错误
 */
const testError = (): void => {
  // 抛出一个测试错误
  throw new Error('这是一个测试错误 - Vue3 监控测试')
}

/**
 * 测试未处理的 Promise 拒绝
 */
const testUnhandledRejection = (): void => {
  // 创建一个会被拒绝的 Promise
  Promise.reject(new Error('这是一个未处理的 Promise 拒绝测试'))
}

/**
 * 测试 XHR 请求
 */
const testXhr = (): void => {
  // 创建一个 XMLHttpRequest 请求
  const xhr = new (globalThis as typeof globalThis & { XMLHttpRequest: new () => XMLHttpRequest }).XMLHttpRequest() // 创建 XHR 实例
  xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/1') // 配置请求方法和 URL
  xhr.send() // 发送请求
}

/**
 * 测试 Fetch 请求
 */
const testFetch = async (): Promise<void> => {
  // 使用 Fetch API 发送请求
  await fetch('https://jsonplaceholder.typicode.com/posts/1')
}

/**
 * 测试慢请求（超过超时阈值）
 */
const testSlowRequest = (): void => {
  // 创建一个会延迟响应的请求
  const xhr = new XMLHttpRequest() // 创建 XHR 实例
  xhr.open('GET', 'https://httpbin.org/delay/6') // 请求延迟 6 秒（超过 5 秒阈值）
  xhr.send() // 发送请求
}

/**
 * 测试 Hash 路由变化
 */
const testHashChange = (): void => {
  // 改变 hash 路由
  window.location.hash = `#test-${Date.now()}` // 设置新的 hash 值
}

/**
 * 测试 History 路由变化
 */
const testHistoryChange = (): void => {
  // 使用 history.pushState 改变路由
  const newUrl = `${window.location.pathname}?test=${Date.now()}` // 构建新的 URL
  window.history.pushState({}, '', newUrl) // 推送新的历史记录
}

/**
 * 测试点击事件（点击按钮本身就会触发）
 */
const testClick = (): void => {
  // 点击事件会在按钮点击时自动触发，这里只是提示
  console.log('点击事件测试 - 这个点击会被监控记录')
}

/**
 * 测试 onMounted 生命周期错误
 */
const testOnMountedError = (): void => {
  // 先隐藏组件（如果已显示）
  showLifecycleComponent.value = false // 设置显示状态为 false
  // 设置错误类型为 mounted
  lifecycleErrorType.value = 'mounted' // 设置错误类型
  // 使用 nextTick 确保组件完全卸载后再显示
  setTimeout(() => {
    // 显示生命周期测试组件，组件挂载时会触发错误
    showLifecycleComponent.value = true // 设置显示状态为 true
  }, 100) // 延迟 100ms 确保组件完全卸载
}

/**
 * 测试 onBeforeMount 生命周期错误
 */
const testOnBeforeMountError = (): void => {
  // 先隐藏组件（如果已显示）
  showLifecycleComponent.value = false // 设置显示状态为 false
  // 设置错误类型为 beforeMount
  lifecycleErrorType.value = 'beforeMount' // 设置错误类型
  // 使用 nextTick 确保组件完全卸载后再显示
  setTimeout(() => {
    // 显示生命周期测试组件，组件挂载前会触发错误
    showLifecycleComponent.value = true // 设置显示状态为 true
  }, 100) // 延迟 100ms 确保组件完全卸载
}

/**
 * 测试 onUpdated 生命周期错误
 */
const testOnUpdatedError = (): void => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true // 设置显示状态为 true
    lifecycleErrorType.value = 'updated' // 设置错误类型
    // 等待组件挂载后再触发更新
    setTimeout(() => {
      // 触发组件更新，更新时会触发错误
      updateTrigger.value++ // 增加更新触发器值，触发组件重新渲染
    }, 100) // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并触发更新
    lifecycleErrorType.value = 'updated' // 设置错误类型
    // 触发组件更新，更新时会触发错误
    updateTrigger.value++ // 增加更新触发器值，触发组件重新渲染
  }
}

/**
 * 测试 onBeforeUpdate 生命周期错误
 */
const testOnBeforeUpdateError = (): void => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true // 设置显示状态为 true
    lifecycleErrorType.value = 'beforeUpdate' // 设置错误类型
    // 等待组件挂载后再触发更新
    setTimeout(() => {
      // 触发组件更新，更新前会触发错误
      updateTrigger.value++ // 增加更新触发器值，触发组件重新渲染
    }, 100) // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并触发更新
    lifecycleErrorType.value = 'beforeUpdate' // 设置错误类型
    // 触发组件更新，更新前会触发错误
    updateTrigger.value++ // 增加更新触发器值，触发组件重新渲染
  }
}

/**
 * 测试 onUnmounted 生命周期错误
 */
const testOnUnmountedError = (): void => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true // 设置显示状态为 true
    lifecycleErrorType.value = 'unmounted' // 设置错误类型
    // 等待组件挂载后再卸载
    setTimeout(() => {
      // 隐藏组件，卸载时会触发错误
      showLifecycleComponent.value = false // 设置显示状态为 false，触发组件卸载
    }, 100) // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并卸载
    lifecycleErrorType.value = 'unmounted' // 设置错误类型
    // 隐藏组件，卸载时会触发错误
    showLifecycleComponent.value = false // 设置显示状态为 false，触发组件卸载
  }
}

/**
 * 测试 onBeforeUnmount 生命周期错误
 */
const testOnBeforeUnmountError = (): void => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true // 设置显示状态为 true
    lifecycleErrorType.value = 'beforeUnmount' // 设置错误类型
    // 等待组件挂载后再卸载
    setTimeout(() => {
      // 隐藏组件，卸载前会触发错误
      showLifecycleComponent.value = false // 设置显示状态为 false，触发组件卸载
    }, 100) // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并卸载
    lifecycleErrorType.value = 'beforeUnmount' // 设置错误类型
    // 隐藏组件，卸载前会触发错误
    showLifecycleComponent.value = false // 设置显示状态为 false，触发组件卸载
  }
}
</script>

<template>
  <div class="container">
    <!-- 监控配置展示区域 -->
    <div class="config-section">
      <h2>监控配置项</h2>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">DSN:</span>
          <span class="config-value">{{ monitorConfig.dsn }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">API Key:</span>
          <span class="config-value">{{ monitorConfig.apikey }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">User ID:</span>
          <span class="config-value">{{ monitorConfig.userId }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">录屏时间间隔:</span>
          <span class="config-value">{{ monitorConfig.recordScreentime }}秒</span>
        </div>
        <div class="config-item">
          <span class="config-label">最大面包屑数:</span>
          <span class="config-value">{{ monitorConfig.maxBreadcrumbs }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">XHR 超时阈值:</span>
          <span class="config-value">{{ monitorConfig.xhrTimeoutThreshold }}ms</span>
        </div>
      </div>
    </div>

    <!-- 测试按钮区域 -->
    <div class="test-section">
      <h2>监控功能测试</h2>
      <div class="test-buttons">
        <button class="test-btn error" @click="testError">
          测试 JavaScript 错误
        </button>
        <button class="test-btn rejection" @click="testUnhandledRejection">
          测试 Promise 拒绝
        </button>
        <button class="test-btn xhr" @click="testXhr">
          测试 XHR 请求
        </button>
        <button class="test-btn fetch" @click="testFetch">
          测试 Fetch 请求
        </button>
        <button class="test-btn slow" @click="testSlowRequest">
          测试慢请求（超时）
        </button>
        <button class="test-btn hash" @click="testHashChange">
          测试 Hash 路由变化
        </button>
        <button class="test-btn history" @click="testHistoryChange">
          测试 History 路由变化
        </button>
        <button class="test-btn click" @click="testClick">
          测试点击事件
        </button>
      </div>
    </div>

    <!-- 生命周期错误测试区域 -->
    <div class="test-section">
      <h2>生命周期错误测试</h2>
      <div class="test-buttons">
        <button class="test-btn lifecycle mounted" @click="testOnMountedError">
          测试 onMounted 错误
        </button>
        <button class="test-btn lifecycle before-mount" @click="testOnBeforeMountError">
          测试 onBeforeMount 错误
        </button>
        <button class="test-btn lifecycle updated" @click="testOnUpdatedError">
          测试 onUpdated 错误
        </button>
        <button class="test-btn lifecycle before-update" @click="testOnBeforeUpdateError">
          测试 onBeforeUpdate 错误
        </button>
        <button class="test-btn lifecycle unmounted" @click="testOnUnmountedError">
          测试 onUnmounted 错误
        </button>
        <button class="test-btn lifecycle before-unmount" @click="testOnBeforeUnmountError">
          测试 onBeforeUnmount 错误
        </button>
      </div>
    </div>

    <!-- 生命周期测试子组件 -->
    <LifecycleTestComponent 
      v-if="showLifecycleComponent" 
      :update-trigger="updateTrigger"
      :error-type="lifecycleErrorType"
      key="lifecycle-test"
    />
  </div>
</template>

<style scoped>
.container {
  width: 100%; /* 最大宽度 */
  margin: 0 auto; /* 居中 */
  padding: 2rem; /* 内边距 */
}

.header {
  text-align: center; /* 文本居中 */
  margin-bottom: 2rem; /* 底部外边距 */
}

.header h1 {
  margin-bottom: 1rem; /* 底部外边距 */
  color: #42b883; /* Vue 主题色 */
}

.logos {
  display: flex; /* 弹性布局 */
  justify-content: center; /* 水平居中 */
  gap: 2rem; /* 间距 */
}

.logo {
  height: 6em; /* 高度 */
  padding: 1.5em; /* 内边距 */
  will-change: filter; /* 优化性能 */
  transition: filter 300ms; /* 过渡效果 */
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa); /* 悬停阴影效果 */
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa); /* Vue logo 悬停效果 */
}

.config-section {
  background: #f5f5f5; /* 背景色 */
  border-radius: 8px; /* 圆角 */
  padding: 1.5rem; /* 内边距 */
  margin-bottom: 2rem; /* 底部外边距 */
}

.config-section h2 {
  margin-top: 0; /* 顶部外边距 */
  margin-bottom: 1rem; /* 底部外边距 */
  color: #333; /* 文字颜色 */
}

.config-grid {
  display: grid; /* 网格布局 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 自适应列 */
  gap: 1rem; /* 间距 */
}

.config-item {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  padding: 0.5rem; /* 内边距 */
  background: white; /* 背景色 */
  border-radius: 4px; /* 圆角 */
}

.config-label {
  font-weight: bold; /* 粗体 */
  color: #666; /* 文字颜色 */
}

.config-value {
  color: #42b883; /* 值颜色 */
  font-family: monospace; /* 等宽字体 */
}

.test-section {
  background: #fff; /* 背景色 */
  border-radius: 8px; /* 圆角 */
  padding: 1.5rem; /* 内边距 */
  border: 1px solid #e0e0e0; /* 边框 */
}

.test-section h2 {
  margin-top: 0; /* 顶部外边距 */
  margin-bottom: 1rem; /* 底部外边距 */
  color: #333; /* 文字颜色 */
}

.test-buttons {
  display: grid; /* 网格布局 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自适应列 */
  gap: 1rem; /* 间距 */
}

.test-btn {
  padding: 0.75rem 1.5rem; /* 内边距 */
  border: none; /* 无边框 */
  border-radius: 6px; /* 圆角 */
  font-size: 1rem; /* 字体大小 */
  font-weight: 500; /* 字体粗细 */
  cursor: pointer; /* 鼠标指针 */
  transition: all 0.3s; /* 过渡效果 */
  color: white; /* 文字颜色 */
}

.test-btn:hover {
  transform: translateY(-2px); /* 悬停上移 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* 悬停阴影 */
}

.test-btn.error {
  background: #f56565; /* 错误按钮背景色 */
}

.test-btn.rejection {
  background: #ed8936; /* Promise 拒绝按钮背景色 */
}

.test-btn.xhr {
  background: #4299e1; /* XHR 按钮背景色 */
}

.test-btn.fetch {
  background: #48bb78; /* Fetch 按钮背景色 */
}

.test-btn.slow {
  background: #9f7aea; /* 慢请求按钮背景色 */
}

.test-btn.hash {
  background: #38b2ac; /* Hash 路由按钮背景色 */
}

.test-btn.history {
  background: #3182ce; /* History 路由按钮背景色 */
}

.test-btn.click {
  background: #805ad5; /* 点击事件按钮背景色 */
}

.test-btn.lifecycle.mounted {
  background: #e53e3e; /* onMounted 错误按钮背景色 */
}

.test-btn.lifecycle.before-mount {
  background: #c53030; /* onBeforeMount 错误按钮背景色 */
}

.test-btn.lifecycle.updated {
  background: #38a169; /* onUpdated 错误按钮背景色 */
}

.test-btn.lifecycle.before-update {
  background: #2f855a; /* onBeforeUpdate 错误按钮背景色 */
}

.test-btn.lifecycle.unmounted {
  background: #805ad5; /* onUnmounted 错误按钮背景色 */
}

.test-btn.lifecycle.before-unmount {
  background: #6b46c1; /* onBeforeUnmount 错误按钮背景色 */
}
</style>
