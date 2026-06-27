// plugin.ts — Vue plugin：全局注册 app.config.globalProperties.$t
//
// 安装后所有组件模板可直接使用 {{ $t('key') }}，无需手动 inject。

import type { App } from "vue";
import { unref } from "vue";
import type { I18nScope, SlotValue } from "@xxmm/i18n";
import type { LangRef } from "./types";

// ---- Plugin Options ----

export interface I18nVuePluginOptions {
  /** 全局 scope（通常为 "app" 主 scope） */
  scope: I18nScope;
  /** Vue 响应式语言引用 */
  langRef: LangRef;
}

// ---- createI18nVue ----

/**
 * 创建 Vue i18n 插件。
 *
 * @example
 * ```ts
 * import { createI18nVue } from "@xxmm/i18n-vue";
 *
 * const app = createApp(App);
 * app.use(createI18nVue({ scope: appScope, langRef: lang }));
 *
 * // 此后所有组件模板都可使用：
 * // {{ $t('buttons.save') }}
 * ```
 */
export function createI18nVue(options: I18nVuePluginOptions) {
  const { scope, langRef } = options;

  return {
    install(app: App): void {
      const $t = (
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

      app.config.globalProperties.$t = $t;
    },
  };
}
