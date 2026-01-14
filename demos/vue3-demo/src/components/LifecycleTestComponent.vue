<script setup lang="ts">
import { onMounted, onUpdated, onBeforeMount, onBeforeUpdate, onBeforeUnmount, onUnmounted } from 'vue' // 导入生命周期钩子

// 定义组件接收的 props
interface Props {
  updateTrigger: number // 更新触发器，用于触发组件更新
  errorType?: string // 错误类型，用于指定在哪个生命周期抛出错误
}

// 接收 props
const props = withDefaults(defineProps<Props>(), {
  errorType: 'mounted' // 默认错误类型为 mounted
})

// onBeforeMount 生命周期钩子 - 组件挂载前执行
onBeforeMount(() => {
  // 如果错误类型是 beforeMount，则抛出错误
  if (props.errorType === 'beforeMount') {
    throw new Error('onBeforeMount 生命周期错误测试 - Vue3 监控测试')
  }
})

// onMounted 生命周期钩子 - 组件挂载后执行
onMounted(() => {
  // 如果错误类型是 mounted，则抛出错误
  if (props.errorType === 'mounted') {
    throw new Error('onMounted 生命周期错误测试 - Vue3 监控测试')
  }
})

// onBeforeUpdate 生命周期钩子 - 组件更新前执行
onBeforeUpdate(() => {
  // 如果错误类型是 beforeUpdate，则抛出错误
  if (props.errorType === 'beforeUpdate') {
    throw new Error('onBeforeUpdate 生命周期错误测试 - Vue3 监控测试')
  }
})

// onUpdated 生命周期钩子 - 组件更新后执行
onUpdated(() => {
  // 如果错误类型是 updated，则抛出错误
  if (props.errorType === 'updated') {
    throw new Error('onUpdated 生命周期错误测试 - Vue3 监控测试')
  }
})

// onBeforeUnmount 生命周期钩子 - 组件卸载前执行
onBeforeUnmount(() => {
  // 如果错误类型是 beforeUnmount，则抛出错误
  if (props.errorType === 'beforeUnmount') {
    throw new Error('onBeforeUnmount 生命周期错误测试 - Vue3 监控测试')
  }
})

// onUnmounted 生命周期钩子 - 组件卸载后执行
onUnmounted(() => {
  // 如果错误类型是 unmounted，则抛出错误
  if (props.errorType === 'unmounted') {
    throw new Error('onUnmounted 生命周期错误测试 - Vue3 监控测试')
  }
})
</script>

<template>
  <div class="lifecycle-test-component">
    <!-- 生命周期测试组件内容 -->
    <p>生命周期测试组件 (更新次数: {{ updateTrigger }})</p>
  </div>
</template>

<style scoped>
.lifecycle-test-component {
  padding: 1rem; /* 内边距 */
  margin-top: 1rem; /* 顶部外边距 */
  background: #fff3cd; /* 背景色 */
  border: 1px solid #ffc107; /* 边框 */
  border-radius: 4px; /* 圆角 */
}
</style>
