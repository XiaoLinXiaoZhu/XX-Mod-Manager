// scope.ts — i18n scope 核心：纯翻译逻辑，框架无关
//
// 设计：
//   - 每个 scope 有独立的 defaultLanguage 和翻译表
//   - translate() 是纯函数：给定 key + 目标语言 → 翻译后的文本
//   - 不依赖任何 UI 框架，可在 Node.js / Bun / 浏览器中使用

export type Language = string;

export interface I18nScopeConfig {
  /** scope 标识（主程序 "app"，插件则为插件 ID） */
  id: string;
  /** i18n`...` 中模板文本属于哪种语言 */
  defaultLanguage: Language;
  /** 翻译表：{ 目标语言: { 原文key: 翻译文本 } } */
  translations?: Record<Language, Record<string, string>>;
}

/** 插槽值：模板中 ${...} 的实际值 */
export type SlotValue = string | number | boolean | null | undefined;

// ---- 插值 ----

const SLOT_MARKER = "{{}}";

/** 将模板字符串数组和插槽值还原为最终字符串 */
export function interpolate(
  strings: Readonly<TemplateStringsArray> | string,
  slots: Readonly<SlotValue[]>,
): string {
  if (typeof strings === "string") {
    // 无插槽：翻译文本中可能有 {{}}，但这里没有 slots
    return strings;
  }
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i] ?? "";
    if (i < slots.length) {
      result += String(slots[i] ?? "");
    }
  }
  return result;
}

/** 使用翻译模板 + 插槽值还原 */
export function interpolateTemplate(
  template: string,
  slots: Readonly<SlotValue[]>,
): string {
  let result = template;
  for (const slot of slots) {
    result = result.replace(SLOT_MARKER, String(slot ?? ""));
  }
  return result;
}

// ---- Scope ----

export interface I18nScope {
  readonly id: string;
  readonly defaultLanguage: Language;
  /** 纯翻译查找：不处理插槽 */
  lookup(key: string, targetLang: Language): string | undefined;
  /** 完整翻译：key → 目标语言文本，处理插槽，fallback 到 defaultLanguage */
  translate(
    key: string,
    targetLang: Language,
    slots?: Readonly<SlotValue[]>,
  ): string;
  /** 从模板字符串数组提取 key */
  keyFromTemplate(strings: Readonly<TemplateStringsArray>): string;
}

export function createI18nScope(config: I18nScopeConfig): I18nScope {
  const translations = config.translations ?? {};

  return {
    id: config.id,
    defaultLanguage: config.defaultLanguage,

    keyFromTemplate(strings) {
      return strings.join(SLOT_MARKER);
    },

    lookup(key, targetLang) {
      if (targetLang === config.defaultLanguage) return key;
      return translations[targetLang]?.[key];
    },

    translate(key, targetLang, slots = []) {
      if (targetLang === config.defaultLanguage) {
        return interpolate(key, slots);
      }
      const translation = translations[targetLang]?.[key];
      if (translation !== undefined) {
        return interpolateTemplate(translation, slots);
      }
      // fallback
      return interpolate(key, slots);
    },
  };
}
