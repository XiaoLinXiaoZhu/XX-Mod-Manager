// Language.ts — TranslatedText / setCurrentLanguage 兼容层
//
// TODO: 迁移完成后删除此文件。
// 消费者应改为直接使用 @xxmm/i18n：
//   new TranslatedText({zh_cn, en}) → appI18n("key")
//   setCurrentLanguage(lang) → langState.value = lang
//
// 旧代码使用 new TranslatedText({zh_cn, en}) 和 setCurrentLanguage(lang)。
// 新架构使用 @xxmm/i18n（appI18n + langState）。
// 此兼容层保留旧的 API 表面，内部委托给新系统。

import { appI18n, langState } from "./I18nConfig";

/** 设置全局语言（兼容旧 API） */
export function setCurrentLanguage(lang: string): void {
  langState.value = lang as "zh_cn" | "en";
}

/**
 * 双语文本（兼容旧 API）。
 *
 * 旧用法：
 *   const tt = new TranslatedText({zh_cn: "你好", en: "Hello"});
 *   tt.get()  // → "你好" (lang=zh_cn) 或 "Hello" (lang=en)
 *
 * 新实现：直接委托给 appI18n，中文文本即 key。
 *
 * TODO: 迁移后删除。翻译条目需提前在 I18nConfig.ts 中注册。
 */
export class TranslatedText {
  private zh: string;
  private en: string;

  constructor(text: { zh_cn: string; en: string } | string, enFallback?: string) {
    if (typeof text === "string") {
      this.zh = text;
      this.en = enFallback ?? text;
    } else {
      this.zh = text.zh_cn;
      this.en = text.en;
    }
  }

  /** 返回当前语言对应的文本 */
  get(): string {
    const translated = appI18n(this.zh);
    return translated;
  }
}
