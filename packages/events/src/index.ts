// @xxmm/events — 类型安全进程内事件总线

import { e } from "./channel";
import type { EventChannel } from "./channel";
import { createEventBus } from "./bus";
import type { EventBus } from "./bus";

export { e, createEventBus };
export type { EventChannel, EventBus };

// ---- 应用级事件通道 ----
// 集中定义，替代旧的 EventType 枚举。

export const AppEvents = {
  wakeUp: e("wakeUp"),
  initDone: e<unknown>("initDone"),
  startDone: e("startDone"),
  pluginLoaded: e<unknown>("pluginLoaded"),
  pluginEnabled: e<unknown>("pluginEnabled"),
  pluginDisabled: e<unknown>("pluginDisabled"),
  themeChange: e<string>("themeChange"),
  languageChange: e<string>("languageChange"),
  lastClickedModChanged: e<unknown>("lastClickedModChanged"),
  modInfoChanged: e<unknown>("modInfoChanged"),
  currentCharacterChanged: e<string>("currentCharacterChanged"),
  currentPresetChanged: e<string>("currentPresetChanged"),
  currentModChanged: e<unknown>("currentModChanged"),
  modListChanged: e("modListChanged"),
  currentTabChanged: e<string>("currentTabChanged"),
  modsApplied: e("modsApplied"),
  addMod: e("addMod"),
  addPreset: e("addPreset"),
  toggledMod: e<unknown>("toggledMod"),
  windowBlur: e("windowBlur"),
  windowFocus: e("windowFocus"),
  windowSleep: e("windowSleep"),
  windowWake: e("windowWake"),
  /** 插件调用了 ctx.config.refreshSchema()，payload 为 pluginId */
  pluginSchemaChanged: e<string>("pluginSchemaChanged"),
} as const;
