// I18nConfig.ts — 应用级 i18n 配置
//
// 提供全局 LanguageState 和 app scope，供 @xxmm/helper、@xxmm/core 及 apps 共用。
// 替代旧的 Language.ts（TranslatedText / setCurrentLanguage）。

import { createLanguageState, createI18nScope, createI18nFn } from "@xxmm/i18n";
import type { Language, LanguageState, I18nScope, I18nFn } from "@xxmm/i18n";

// ---- 全局语言状态 ----

/** 全局语言状态（替代旧的 setCurrentLanguage / currentLanguage） */
export const langState: LanguageState = createLanguageState("zh_cn" as Language);

// ---- App Scope ----

/** 汇总自所有非插件 TranslatedText 对（zh_cn 为 key，en 为翻译） */
const appTranslations: Record<string, Record<string, string>> = {
  en: {
    // XManager
    "Archive 解压缩模块未找到": "Archive is not defined",
    "配置文件不存在": "Config file not found",
    "Mod 源路径": "Mod Source Path",
    "mod列表为空": "Mod list is empty",
    "从 {{}} 加载mod": "loadMods from {{}}",
    "预设 {{}} 未找到": "Preset {{}} not found",
    // XXMMCore
    "自定义配置文件夹不存在": "Custom config folder not exist",
    // configManager
    "没有描述": "No Description",
    "未找到配置文件": "No config found",
    "未找到配置文件夹，正在创建一个": "Config folder not found, creating a new one",
    "名称不能为空": "Name cannot be empty",
    "配置已存在": "Config already exists",
    "配置已创建": "Config created",
    // dialogModInfo2
    "无法将 mod 名称设置为空": "Cannot set mod name to empty",
    "mod 名称已存在": "Mod name already exists",
    // ApplyMods
    "modSourcePath 为空，请在 设置/高级设置 检查你的配置":
      "modSourcePath is empty. Please check your configuration in Settings/Advanced Settings.",
    "modTargetPath 为空，请在 设置/高级设置 检查你的配置":
      "modTargetPath is empty. Please check your configuration in Settings/Advanced Settings.",
    "在非传统模式下，modSourcePath 和 modTargetPath 不能是相同的，请在 设置/高级设置 检查你的配置，或者选择使用传统模式":
      "modSourcePath and modTargetPath are the same. Please check your configuration in Settings/Advanced Settings.",
    "modSourcePath 不存在: {{}}，请在 设置/高级设置 检查你的配置":
      "modSourcePath does not exist: {{}}. Please check your configuration in Settings/Advanced Settings.",
    "modTargetPath 不存在: {{}}，请在 设置/高级设置 检查你的配置":
      "modTargetPath does not exist: {{}}. Please check your configuration in Settings/Advanced Settings.",
    "modSourcePath 不是一个目录: {{}}，请在 设置/高级设置 检查你的配置":
      "modSourcePath is not a directory: {{}}. Please check your configuration in Settings/Advanced Settings.",
    "modTargetPath 不是一个目录: {{}}，请在 设置/高级设置 检查你的配置":
      "modTargetPath is not a directory: {{}}. Please check your configuration in Settings/Advanced Settings.",
    "无法在 {{}} 中创建链接，请检查权限或是确认您的磁盘类型是否支持创建链接。或者您可以换用使用传统方式应用mod。":
      "Failed to create link in {{}}, please check permissions or confirm if your disk type supports creating links. Or you can use the traditional way to apply mod.",
    "mod名称和mod文件夹名称一致，无法使用传统方式应用mod。":
      "Mod name and mod folder name are the same, unable to use the traditional way to apply mod.",
    "重命名mod文件夹 {{}} 失败，请检查权限。":
      "Failed to rename mod folder {{}}, please check permissions.",
    "将mod文件夹 {{}} 重命名为 {{}}":
      "Renamed mod folder {{}} to {{}}",
    // PathHelper (simplified)
    "目录无效: {{}}": "dir is invalid: {{}}",
    "目录不存在: {{}}": "dir not found: {{}}",
    "不是一个目录: {{}}": "dir is not a directory: {{}}",
    "未知错误": "Unknown Error",
  },
};

/** 应用级 scope */
export const appScope: I18nScope = createI18nScope({
  id: "app",
  defaultLanguage: "zh_cn",
  translations: appTranslations,
});

// ---- 便捷函数 ----

/**
 * 基于全局 langState 的 i18n 函数。
 *
 * 非 Vue 上下文（core、helper 等）使用此函数；
 * Vue 组件中优先使用 useScopedI18n。
 */
export const appI18n: I18nFn = createI18nFn(appScope, langState);
