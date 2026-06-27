// store.ts — createAppStore() 工厂函数
//
// 用 @vue/reactivity 的 reactive() 创建单一响应式数据源，
// 替代旧架构中 IManager 的 _config/_data/_temp + g_* + g_*_vue 三份拷贝。
//
// reactive() 创建的对象：
// - Vue 组件中可直接用于 computed/watch/template
// - 普通 JS 代码可直接读写，无需 .value
// - 无 Proxy 同步开销（reactive 本身就是 Proxy）

import { reactive } from "@vue/reactivity";
import type { AppStore, AppConfig, AppData, AppTemp } from "./types";

/** 默认配置值 */
function defaultConfig(): AppConfig {
  return {
    firstLoad: true,
    language: "zh_cn",
    theme: "dark",
    modSourcePath: null,
    modTargetPath: null,
    presetPath: null,
    ifStartWithLastPreset: true,
    lastUsedPreset: null,
    bounds: { width: 800, height: 600, x: -1, y: -1 },
    ifKeepModNameAsModFolderName: false,
    ifUseTraditionalApply: false,
  };
}

/** 默认运行时数据 */
function defaultData(): AppData {
  return {
    modList: [],
    presetList: [],
    characterList: [],
  };
}

/** 默认临时状态 */
function defaultTemp(): AppTemp {
  return {
    lastClickedMod: null,
    currentMod: null,
    currentCharacter: null,
    currentTab: "mod",
    currentPreset: "default",
    wakeUped: false,
    ifDontSaveOnClose: false,
  };
}

/**
 * 创建应用状态 Store。
 *
 * 返回的 config / data / temp 均为 reactive 对象：
 * - 写入任意属性自动触发 Vue 组件更新
 * - 普通 JS 代码直接读写，无需 .value
 * - 可在 console / debugger 中直接检查
 *
 * 不包含任何 I/O 逻辑 —— 持久化由调用方负责。
 */
export function createAppStore(): AppStore {
  return {
    config: reactive<AppConfig>(defaultConfig()),
    data: reactive<AppData>(defaultData()),
    temp: reactive<AppTemp>(defaultTemp()),
  };
}
