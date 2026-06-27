// composable.ts — useScopedI18n：Vue 响应式 scoped i18n composable
//
// 核心设计：
//   - $t / t 在调用时读取 langRef.value，触发 Vue 依赖追踪
//   - 模板中使用 $t('key') 即可自动响应语言切换
//   - <script> 中使用 $t`模板${slot}` 支持 tagged template
//
// 与 @xxmm/i18n 的 createI18nFn 区别：
//   - createI18nFn 依赖 LanguageState（非 Vue 响应式）
//   - useScopedI18n 依赖 Vue Ref<Language>，直接融入 Vue 响应式系统

import { unref } from "vue";
import type { I18nScope, SlotValue } from "@xxmm/i18n";
import type { LangRef } from "./types";

// ---- ScopedI18n ----

export interface ScopedI18n {
  /**
   * 纯函数调用：t("保存") → string
   *
   * 读取 langRef，触发 Vue 依赖追踪。在 computed / watchEffect 内使用时自动响应。
   */
  t: (text: string) => string;

  /**
   * 响应式翻译函数，支持两种调用方式：
   *
   * 模板中：{{ $t('editDialog.save') }}
   * 脚本中：$t`处理了 ${n} 个文件`
   *
   * 调用时读取 langRef，触发 Vue 依赖追踪。
   */
  $t: {
    (key: string): string;
    (strings: TemplateStringsArray, ...slots: SlotValue[]): string;
  };
}

// ---- useScopedI18n ----

/**
 * 创建绑定 scope 和 Vue 响应式语言的翻译函数。
 *
 * @param scope  - 翻译 scope（来自 createI18nScope）
 * @param langRef - Vue Ref<Language>：切换 .value 后模板自动更新
 *
 * @example
 * ```ts
 * const scope = createI18nScope({ id: "app", defaultLanguage: "zh_cn", translations });
 * const lang = ref<Language>("zh_cn");
 * const { t, $t } = useScopedI18n(scope, lang);
 *
 * // 模板
 * // {{ $t('buttons.save') }}
 *
 * // 脚本
 * const msg = $t`你好 ${name}`;
 * ```
 */
export function useScopedI18n(
  scope: I18nScope,
  langRef: LangRef,
): ScopedI18n {
  const translate = (
    textOrStrings: string | TemplateStringsArray,
    ...slots: SlotValue[]
  ): string => {
    const lang = unref(langRef);
    const key =
      typeof textOrStrings === "string"
        ? textOrStrings
        : scope.keyFromTemplate(textOrStrings);
    return scope.translate(key, lang, slots);
  };

  return {
    t: (text: string): string => scope.translate(text, unref(langRef)),
    $t: translate as ScopedI18n["$t"],
  };
}
