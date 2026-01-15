import { inject, ref } from "vue"; // 导入 Vue 的 inject API 和响应式 API
// @ts-ignore - Vetur 对 Vue 3 <script setup> 的支持有限，无法识别自动导出的组件
import LifecycleTestComponent from "./components/LifecycleTestComponent.vue"; // 导入生命周期测试组件
const monitorConfig = inject("monitorConfig", {
  dsn: "", // 默认 DSN
  apikey: "", // 默认 API Key
  userId: "", // 默认用户 ID
  recordScreentime: 0, // 默认录屏时间间隔
  maxBreadcrumbs: 0, // 默认最大面包屑数量
  xhrTimeoutThreshold: 0, // 默认 XHR 超时阈值
}); // 结束注入与默认值
// 用于控制子组件显示/隐藏的响应式变量
const showLifecycleComponent = ref(false); // 控制生命周期测试组件显示状态
const updateTrigger = ref(0); // 用于触发组件更新的计数器
const lifecycleErrorType = ref("mounted"); // 当前生命周期错误类型
/**
 * 测试 JavaScript 错误
 */
const testError = () => {
  // 抛出一个测试错误
  throw new Error("这是一个测试错误 - Vue3 监控测试");
};
/**
 * 测试未处理的 Promise 拒绝
 */
const testUnhandledRejection = () => {
  // 创建一个会被拒绝的 Promise
  Promise.reject(new Error("这是一个未处理的 Promise 拒绝测试"));
};
/**
 * 测试 XHR 请求
 */
const testXhr = () => {
  // 创建一个 XMLHttpRequest 请求
  const xhr = new globalThis.XMLHttpRequest(); // 创建 XHR 实例
  xhr.open("GET", "https://jsonplaceholder.typicode.com/posts/1"); // 配置请求方法和 URL
  xhr.send(); // 发送请求
};
/**
 * 测试 Fetch 请求
 */
const testFetch = async () => {
  // 使用 Fetch API 发送请求
  await fetch("https://jsonplaceholder.typicode.com/posts/1");
};
/**
 * 测试慢请求（超过超时阈值）
 */
const testSlowRequest = () => {
  // 创建一个会延迟响应的请求
  const xhr = new XMLHttpRequest(); // 创建 XHR 实例
  xhr.open("GET", "https://httpbin.org/delay/6"); // 请求延迟 6 秒（超过 5 秒阈值）
  xhr.send(); // 发送请求
};
/**
 * 测试 Hash 路由变化
 */
const testHashChange = () => {
  // 改变 hash 路由
  window.location.hash = `#test-${Date.now()}`; // 设置新的 hash 值
};
/**
 * 测试 History 路由变化
 */
const testHistoryChange = () => {
  // 使用 history.pushState 改变路由
  const newUrl = `${window.location.pathname}?test=${Date.now()}`; // 构建新的 URL
  window.history.pushState({}, "", newUrl); // 推送新的历史记录
};
/**
 * 测试点击事件（点击按钮本身就会触发）
 */
const testClick = () => {
  // 点击事件会在按钮点击时自动触发，这里只是提示
  console.log("点击事件测试 - 这个点击会被监控记录");
};
/**
 * 测试 onMounted 生命周期错误
 */
const testOnMountedError = () => {
  // 先隐藏组件（如果已显示）
  showLifecycleComponent.value = false; // 设置显示状态为 false
  // 设置错误类型为 mounted
  lifecycleErrorType.value = "mounted"; // 设置错误类型
  // 使用 nextTick 确保组件完全卸载后再显示
  setTimeout(() => {
    // 显示生命周期测试组件，组件挂载时会触发错误
    showLifecycleComponent.value = true; // 设置显示状态为 true
  }, 100); // 延迟 100ms 确保组件完全卸载
};
/**
 * 测试 onBeforeMount 生命周期错误
 */
const testOnBeforeMountError = () => {
  // 先隐藏组件（如果已显示）
  showLifecycleComponent.value = false; // 设置显示状态为 false
  // 设置错误类型为 beforeMount
  lifecycleErrorType.value = "beforeMount"; // 设置错误类型
  // 使用 nextTick 确保组件完全卸载后再显示
  setTimeout(() => {
    // 显示生命周期测试组件，组件挂载前会触发错误
    showLifecycleComponent.value = true; // 设置显示状态为 true
  }, 100); // 延迟 100ms 确保组件完全卸载
};
/**
 * 测试 onUpdated 生命周期错误
 */
const testOnUpdatedError = () => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true; // 设置显示状态为 true
    lifecycleErrorType.value = "updated"; // 设置错误类型
    // 等待组件挂载后再触发更新
    setTimeout(() => {
      // 触发组件更新，更新时会触发错误
      updateTrigger.value++; // 增加更新触发器值，触发组件重新渲染
    }, 100); // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并触发更新
    lifecycleErrorType.value = "updated"; // 设置错误类型
    // 触发组件更新，更新时会触发错误
    updateTrigger.value++; // 增加更新触发器值，触发组件重新渲染
  }
};
/**
 * 测试 onBeforeUpdate 生命周期错误
 */
const testOnBeforeUpdateError = () => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true; // 设置显示状态为 true
    lifecycleErrorType.value = "beforeUpdate"; // 设置错误类型
    // 等待组件挂载后再触发更新
    setTimeout(() => {
      // 触发组件更新，更新前会触发错误
      updateTrigger.value++; // 增加更新触发器值，触发组件重新渲染
    }, 100); // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并触发更新
    lifecycleErrorType.value = "beforeUpdate"; // 设置错误类型
    // 触发组件更新，更新前会触发错误
    updateTrigger.value++; // 增加更新触发器值，触发组件重新渲染
  }
};
/**
 * 测试 onUnmounted 生命周期错误
 */
const testOnUnmountedError = () => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true; // 设置显示状态为 true
    lifecycleErrorType.value = "unmounted"; // 设置错误类型
    // 等待组件挂载后再卸载
    setTimeout(() => {
      // 隐藏组件，卸载时会触发错误
      showLifecycleComponent.value = false; // 设置显示状态为 false，触发组件卸载
    }, 100); // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并卸载
    lifecycleErrorType.value = "unmounted"; // 设置错误类型
    // 隐藏组件，卸载时会触发错误
    showLifecycleComponent.value = false; // 设置显示状态为 false，触发组件卸载
  }
};
/**
 * 测试 onBeforeUnmount 生命周期错误
 */
const testOnBeforeUnmountError = () => {
  // 确保组件已显示
  if (!showLifecycleComponent.value) {
    // 如果组件未显示，先显示它
    showLifecycleComponent.value = true; // 设置显示状态为 true
    lifecycleErrorType.value = "beforeUnmount"; // 设置错误类型
    // 等待组件挂载后再卸载
    setTimeout(() => {
      // 隐藏组件，卸载前会触发错误
      showLifecycleComponent.value = false; // 设置显示状态为 false，触发组件卸载
    }, 100); // 延迟 100ms 确保组件已挂载
  } else {
    // 如果组件已显示，直接设置错误类型并卸载
    lifecycleErrorType.value = "beforeUnmount"; // 设置错误类型
    // 隐藏组件，卸载前会触发错误
    showLifecycleComponent.value = false; // 设置显示状态为 false，触发组件卸载
  }
};
const __VLS_ctx = {
  ...{},
  ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header']} */ /** @type {__VLS_StyleScopedClasses['logo']} */ /** @type {__VLS_StyleScopedClasses['logo']} */ /** @type {__VLS_StyleScopedClasses['config-section']} */ /** @type {__VLS_StyleScopedClasses['test-section']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "container" },
});
/** @type {__VLS_StyleScopedClasses['container']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-section" },
});
/** @type {__VLS_StyleScopedClasses['config-section']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.h2,
  __VLS_intrinsics.h2,
)({});
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-grid" },
});
/** @type {__VLS_StyleScopedClasses['config-grid']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .dsn;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .apikey;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .userId;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .recordScreentime;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .maxBreadcrumbs;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "config-item" },
});
/** @type {__VLS_StyleScopedClasses['config-item']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-label" },
});
/** @type {__VLS_StyleScopedClasses['config-label']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.span,
  __VLS_intrinsics.span,
)({
  ...{ class: "config-value" },
});
/** @type {__VLS_StyleScopedClasses['config-value']} */ __VLS_ctx.monitorConfig
  .xhrTimeoutThreshold;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "test-section" },
});
/** @type {__VLS_StyleScopedClasses['test-section']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.h2,
  __VLS_intrinsics.h2,
)({});
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "test-buttons" },
});
/** @type {__VLS_StyleScopedClasses['test-buttons']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testError },
  ...{ class: "test-btn error" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['error']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testUnhandledRejection },
  ...{ class: "test-btn rejection" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['rejection']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testXhr },
  ...{ class: "test-btn xhr" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['xhr']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testFetch },
  ...{ class: "test-btn fetch" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['fetch']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testSlowRequest },
  ...{ class: "test-btn slow" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['slow']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testHashChange },
  ...{ class: "test-btn hash" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['hash']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testHistoryChange },
  ...{ class: "test-btn history" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['history']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testClick },
  ...{ class: "test-btn click" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['click']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "test-section" },
});
/** @type {__VLS_StyleScopedClasses['test-section']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.h2,
  __VLS_intrinsics.h2,
)({});
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "test-buttons" },
});
/** @type {__VLS_StyleScopedClasses['test-buttons']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnMountedError },
  ...{ class: "test-btn lifecycle mounted" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['mounted']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnBeforeMountError },
  ...{ class: "test-btn lifecycle before-mount" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['before-mount']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnUpdatedError },
  ...{ class: "test-btn lifecycle updated" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['updated']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnBeforeUpdateError },
  ...{ class: "test-btn lifecycle before-update" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['before-update']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnUnmountedError },
  ...{ class: "test-btn lifecycle unmounted" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['unmounted']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.button,
  __VLS_intrinsics.button,
)({
  ...{ onClick: __VLS_ctx.testOnBeforeUnmountError },
  ...{ class: "test-btn lifecycle before-unmount" },
});
/** @type {__VLS_StyleScopedClasses['test-btn']} */ /** @type {__VLS_StyleScopedClasses['lifecycle']} */ /** @type {__VLS_StyleScopedClasses['before-unmount']} */ if (
  __VLS_ctx.showLifecycleComponent
) {
  const __VLS_0 = LifecycleTestComponent;
  // @ts-ignore
  const __VLS_1 = __VLS_asFunctionalComponent1(
    __VLS_0,
    new __VLS_0({
      updateTrigger: __VLS_ctx.updateTrigger,
      errorType: __VLS_ctx.lifecycleErrorType,
      key: "lifecycle-test",
    }),
  );
  const __VLS_2 = __VLS_1(
    {
      updateTrigger: __VLS_ctx.updateTrigger,
      errorType: __VLS_ctx.lifecycleErrorType,
      key: "lifecycle-test",
    },
    ...__VLS_functionalComponentArgsRest(__VLS_1),
  );
}
// @ts-ignore
[
  monitorConfig,
  monitorConfig,
  monitorConfig,
  monitorConfig,
  monitorConfig,
  monitorConfig,
  testError,
  testUnhandledRejection,
  testXhr,
  testFetch,
  testSlowRequest,
  testHashChange,
  testHistoryChange,
  testClick,
  testOnMountedError,
  testOnBeforeMountError,
  testOnUpdatedError,
  testOnBeforeUpdateError,
  testOnUnmountedError,
  testOnBeforeUnmountError,
  showLifecycleComponent,
  updateTrigger,
  lifecycleErrorType,
];
const __VLS_export = (await import("vue")).defineComponent({});
export default {};
//# sourceMappingURL=App.vue.js.map
