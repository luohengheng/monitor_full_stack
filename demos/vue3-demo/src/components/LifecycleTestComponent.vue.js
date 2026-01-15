import {
  onMounted,
  onUpdated,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onUnmounted,
} from "vue"; // 导入生命周期钩子
const props = withDefaults(defineProps(), {
  errorType: "mounted", // 默认错误类型为 mounted
});
// onBeforeMount 生命周期钩子 - 组件挂载前执行
onBeforeMount(() => {
  // 如果错误类型是 beforeMount，则抛出错误
  if (props.errorType === "beforeMount") {
    throw new Error("onBeforeMount 生命周期错误测试 - Vue3 监控测试");
  }
});
// onMounted 生命周期钩子 - 组件挂载后执行
onMounted(() => {
  // 如果错误类型是 mounted，则抛出错误
  if (props.errorType === "mounted") {
    throw new Error("onMounted 生命周期错误测试 - Vue3 监控测试");
  }
});
// onBeforeUpdate 生命周期钩子 - 组件更新前执行
onBeforeUpdate(() => {
  // 如果错误类型是 beforeUpdate，则抛出错误
  if (props.errorType === "beforeUpdate") {
    throw new Error("onBeforeUpdate 生命周期错误测试 - Vue3 监控测试");
  }
});
// onUpdated 生命周期钩子 - 组件更新后执行
onUpdated(() => {
  // 如果错误类型是 updated，则抛出错误
  if (props.errorType === "updated") {
    throw new Error("onUpdated 生命周期错误测试 - Vue3 监控测试");
  }
});
// onBeforeUnmount 生命周期钩子 - 组件卸载前执行
onBeforeUnmount(() => {
  // 如果错误类型是 beforeUnmount，则抛出错误
  if (props.errorType === "beforeUnmount") {
    throw new Error("onBeforeUnmount 生命周期错误测试 - Vue3 监控测试");
  }
});
// onUnmounted 生命周期钩子 - 组件卸载后执行
onUnmounted(() => {
  // 如果错误类型是 unmounted，则抛出错误
  if (props.errorType === "unmounted") {
    throw new Error("onUnmounted 生命周期错误测试 - Vue3 监控测试");
  }
});
const __VLS_defaults = {
  errorType: "mounted", // 默认错误类型为 mounted
};
const __VLS_ctx = {
  ...{},
  ...{},
  ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(
  __VLS_intrinsics.div,
  __VLS_intrinsics.div,
)({
  ...{ class: "lifecycle-test-component" },
});
/** @type {__VLS_StyleScopedClasses['lifecycle-test-component']} */ __VLS_asFunctionalElement1(
  __VLS_intrinsics.p,
  __VLS_intrinsics.p,
)({});
__VLS_ctx.updateTrigger;
// @ts-ignore
[updateTrigger];
const __VLS_export = (await import("vue")).defineComponent({
  __typeProps: {},
  props: {},
});
export default {};
//# sourceMappingURL=LifecycleTestComponent.vue.js.map
