// @xxmm/i18n — 带 scope 的 i18n 系统
//
// 核心理念：
//   - 中文文本即 key（或其他 defaultLanguage），无需发明抽象 key
//   - 每个 scope（主程序、每个插件）有独立的 defaultLanguage 和翻译表
//   - 支持 tagged template：i18n`处理了 ${n} 个文件`
//   - 框架无关的核心 + 可选的 Vue 适配层
//
// 使用：
//   import { createI18nScope, createLanguageState, createI18nFn } from "@xxmm/i18n";
//
//   const scope = createI18nScope({
//     id: "my-plugin",
//     defaultLanguage: "en",
//     translations: { zh_cn: { "Hello": "你好" } },
//   });
//   const lang = createLanguageState("en");
//   const i18n = createI18nFn(scope, lang);
//
//   i18n("Hello");         // → "你好" (when lang=zh_cn)
//   i18n`Hello ${name}`;   // → "你好 Alice"

export { createI18nScope } from "./scope";
export type { I18nScope, I18nScopeConfig, Language, SlotValue } from "./scope";
export { interpolate, interpolateTemplate } from "./scope";

export { createLanguageState, createI18nFn } from "./runtime";
export type { LanguageState, I18nFn } from "./runtime";

export { enableMissingLog, disableMissingLog, logMissing } from "./logger";
export type { MissingTranslation, MissingTranslationHandler } from "./logger";
