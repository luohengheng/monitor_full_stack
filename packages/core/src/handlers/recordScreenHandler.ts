// 导入录屏和压缩相关的库
import { Base64 } from "js-base64"; // Base64 编码库
import * as pako from "pako"; // gzip 压缩库
import { record } from "rrweb"; // rrweb 录屏库

import { getTransport } from "../baseClient"; // 获取传输实例
import type { MonitorOptions } from "../types/monitorOptions"; // 导入监控配置选项类型

// 录屏事件类型定义（rrweb 的事件类型）
// 使用 Parameters 和 ReturnType 来推断类型
type RecordOptions = Parameters<typeof record>[0]; // 获取 record 函数的参数类型
type RecordScreenEvent = RecordOptions extends {
  emit?: (event: infer E, isCheckout?: boolean) => void;
}
  ? E
  : never; // 从 emit 回调中推断事件类型
type ListenerHandler = ReturnType<typeof record>; // 获取 record 函数的返回类型

// 录屏状态管理
interface RecordScreenState {
  events: RecordScreenEvent[]; // 存储录屏事件数组
  recordScreenId: string; // 录屏ID
  hasError: boolean; // 是否有错误发生
  stopFn: ListenerHandler; // 停止录屏的函数
}

// 全局录屏状态
const recordScreenState: RecordScreenState = {
  events: [], // 录屏事件数组
  recordScreenId: "", // 录屏ID
  hasError: false, // 是否有错误
  stopFn: undefined, // 停止录屏函数
};

/**
 * 生成 UUID
 * @returns UUID 字符串
 */
function generateUUID(): string {
  // 生成随机 UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    // 生成随机字符
    const r = (Math.random() * 16) | 0; // 随机数 0-15
    const v = c === "x" ? r : (r & 0x3) | 0x8; // x 使用随机数，y 使用特定值
    return v.toString(16); // 转换为十六进制
  });
}

/**
 * 获取时间戳（毫秒）
 * @returns 时间戳
 */
function getTimestamp(): number {
  return Date.now(); // 返回当前时间戳
}

/**
 * 压缩数据
 * @param data 要压缩的数据
 * @returns 压缩后的字符串
 */
export function zip(data: unknown): string {
  // 如果没有数据，直接返回
  if (!data) {
    return data as string; // 返回原数据
  }

  // 判断数据是否需要转为 JSON
  const dataJson =
    typeof data !== "string" && typeof data !== "number" // 如果不是字符串或数字
      ? JSON.stringify(data) // 转换为 JSON 字符串
      : (data as string); // 使用原数据

  // 使用 Base64.encode 处理字符编码，兼容中文
  const str = Base64.encode(dataJson); // Base64 编码

  // 使用 pako.gzip 进行 gzip 压缩
  const binaryString = pako.gzip(str); // 压缩数据

  // 将 Uint8Array 转换为字符串
  const arr = Array.from(binaryString); // 转换为数组
  let s = ""; // 结果字符串
  arr.forEach((item: unknown) => {
    // 遍历数组
    // 确保 item 是数字类型
    if (typeof item === "number") {
      s += String.fromCharCode(item); // 转换为字符
    }
  });

  // 使用 Base64.btoa 进行 Base64 编码
  return Base64.btoa(s); // 返回编码后的字符串
}

/**
 * 设置录屏功能处理器
 * @param options 监控配置选项
 */
export function setupRecordScreenHandler(options: MonitorOptions): void {
  // 检查是否在浏览器环境
  if (typeof window === "undefined") {
    return; // 不在浏览器环境，不进行录屏
  }

  // 检查配置是否允许录屏
  if (options.silentRecordScreen) {
    return; // 如果配置为静默，则不录屏
  }

  // 获取录屏时间间隔，默认 10 秒
  const recordScreentime = options.recordScreentime ?? 10; // 默认 10 秒

  // 初始化录屏ID
  recordScreenState.recordScreenId = generateUUID(); // 生成新的录屏ID

  // 调用 rrweb 的 record 方法开始录屏
  const stopFn = record({
    // emit 回调函数，当有录屏事件时触发
    emit(event: RecordScreenEvent, isCheckout?: boolean) {
      // 如果是检查点（checkout），说明到了时间间隔
      if (isCheckout) {
        // 此段时间内发生错误，上报录屏信息
        if (recordScreenState.hasError) {
          // 保存当前录屏ID
          const recordScreenId = recordScreenState.recordScreenId; // 保存当前ID
          // 生成新的录屏ID
          recordScreenState.recordScreenId = generateUUID(); // 生成新ID

          // 获取传输实例
          const transport = getTransport(); // 获取 transport 实例
          if (transport) {
            // 发送录屏数据
            transport.send({
              type: "record-screen", // 事件类型
              recordScreenId: recordScreenId, // 录屏ID
              time: getTimestamp(), // 时间戳
              status: "ok", // 状态
              events: zip(recordScreenState.events), // 压缩后的录屏事件
            });
          }

          // 清空录屏事件数组
          recordScreenState.events = []; // 清空数组
          // 重置错误标志
          recordScreenState.hasError = false; // 重置标志
        } else {
          // 不上报，清空录屏
          recordScreenState.events = []; // 清空数组
          // 生成新的录屏ID
          recordScreenState.recordScreenId = generateUUID(); // 生成新ID
        }
      }

      // 将事件添加到数组中
      recordScreenState.events.push(event); // 添加事件
    },
    recordCanvas: true, // 录制 canvas 内容
    // 默认每 N 秒重新制作快照（checkout）
    checkoutEveryNms: 1000 * recordScreentime, // 转换为毫秒
  });

  // 保存停止录屏的函数
  recordScreenState.stopFn = stopFn; // 保存函数
}

/**
 * 标记发生错误
 */
export function markError(): void {
  // 标记有错误发生
  recordScreenState.hasError = true; // 设置错误标志
}

/**
 * 停止录屏
 */
export function stopRecordScreen(): void {
  // 如果存在停止函数，调用它
  if (recordScreenState.stopFn) {
    recordScreenState.stopFn(); // 停止录屏
    recordScreenState.stopFn = undefined; // 清空函数引用
  }
}
