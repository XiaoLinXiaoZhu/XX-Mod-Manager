// runtime.ts — 带语言状态管理的 i18n 运行时
//
// 在 scope 基础上增加：
//   - 可切换的当前语言
//   - 订阅语言变更
//   - 生成绑定当前语言的翻译函数

import type { Language, I18nScope, SlotValue } from "./scope";
import { logMissing } from "./logger";

// ---- 语言状态 ----

export interface LanguageState {
  get(): Language;
  set(lang: Language): void;
  onChange(fn: (lang: Language) => void): () => void;
}

/** 创建一个简单的语言状态管理器 */
export function createLanguageState(initial: Language): LanguageState {
  let current = initial;
  const listeners = new Set<(lang: Language) => void>();

  return {
    get: () => current,
    set(lang) {
      if (lang === current) return;
      current = lang;
      for (const fn of listeners) fn(lang);
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// ---- i18n 函数类型 ----

/**
 * Scoped i18n 函数：支持普通调用和 tagged template 两种写法
 *
 *   ctx.i18n("保存成功")        → string
 *   ctx.i18n`处理了 ${n} 个文件` → string
 */
export interface I18nFn {
  (text: string): string;
  (strings: TemplateStringsArray, ...slots: SlotValue[]): string;
}

/** 基于 scope + languageState 创建绑定当前语言的 i18n 函数 */
export function createI18nFn(
  scope: I18nScope,
  langState: LanguageState,
  devLogger?: { file?: string },
): I18nFn {
  const fn = (
    textOrStrings: string | TemplateStringsArray,
    ...slots: SlotValue[]
  ): string => {
    const lang = langState.get();
    const key =
      typeof textOrStrings === "string"
        ? textOrStrings
        : scope.keyFromTemplate(textOrStrings);

    const translation = scope.lookup(key, lang);

    if (translation === undefined && lang !== scope.defaultLanguage) {
      const entry: { scope: string; key: string; targetLang: Language } = {
        scope: scope.id,
        key,
        targetLang: lang,
      };
      // exactOptionalPropertyTypes: 只在有值时附加 file
      const file = devLogger?.file;
      logMissing(file !== undefined ? { ...entry, file } : entry);
    }

    return scope.translate(key, lang, slots);
  };

  return fn as I18nFn;
}
