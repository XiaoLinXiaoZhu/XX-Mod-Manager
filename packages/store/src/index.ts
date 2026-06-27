// index.ts — @xxmm/store barrel export
//
// 用法：
//   import { createAppStore } from "@xxmm/store";
//   const store = createAppStore();
//   store.config.language = "zh_cn";           // 自动触发 Vue 更新
//   watch(() => store.config.theme, (t) => { ... });

export { createAppStore } from "./store";
export type { AppStore, AppConfig, AppData, AppTemp, AppBounds } from "./types";
