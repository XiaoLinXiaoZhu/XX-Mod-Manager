// i18n-vue.test.ts — @xxmm/i18n-vue 功能测试
//
// 测试 useScopedI18n composable 和 createI18nVue plugin。

import { describe, test, expect } from "bun:test";
import { ref } from "vue";
import type { Language, I18nScope, I18nScopeConfig } from "@xxmm/i18n";
import { createI18nScope } from "@xxmm/i18n";
import { useScopedI18n, createI18nVue } from "./index";
import type { ScopedI18n } from "./index";

// ---- 辅助 ----

function zhScope(translations?: Record<Language, Record<string, string>>): I18nScope {
  const config: I18nScopeConfig = {
    id: "app",
    defaultLanguage: "zh_cn",
  };
  if (translations !== undefined) config.translations = translations;
  return createI18nScope(config);
}

// ---- useScopedI18n ----

describe("useScopedI18n", () => {
  test("t() 在当前语言下返回翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("en");
    const { t } = useScopedI18n(scope, lang);

    expect(t("保存")).toBe("Save");
  });

  test("t() 在 defaultLanguage 下原样返回", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("zh_cn");
    const { t } = useScopedI18n(scope, lang);

    expect(t("保存")).toBe("保存");
  });

  test("$t() 函数调用返回翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("en");
    const { $t } = useScopedI18n(scope, lang);

    expect($t("保存")).toBe("Save");
  });

  // NOTE: tagged template 测试 — 在运行时 $t`...` 等价于 $t(templateStrings)
  // 此处通过 scope.keyFromTemplate + scope.translate 验证翻译路径
  test("$t tagged template 翻译 + 插槽", () => {
    const scope = zhScope({ en: { "你好 {{}}": "Hello {{}}" } });
    const lang = ref<Language>("en");
    const { $t } = useScopedI18n(scope, lang);

    // 模拟 tagged template: $t`你好 ${"Alice"}`
    const strings = ["你好 ", ""] as unknown as TemplateStringsArray;
    expect($t(strings, "Alice")).toBe("Hello Alice");
  });

  test("$t tagged template 无翻译时 fallback", () => {
    const scope = zhScope();
    const lang = ref<Language>("en");
    const { $t } = useScopedI18n(scope, lang);

    const strings = ["你好 ", ""] as unknown as TemplateStringsArray;
    expect($t(strings, "Alice")).toBe("你好 Alice");
  });

  test("语言切换后 t() 反映新翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("zh_cn");
    const { t } = useScopedI18n(scope, lang);

    expect(t("保存")).toBe("保存");

    lang.value = "en";
    expect(t("保存")).toBe("Save");
  });

  test("语言切换后 $t() 反映新翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("zh_cn");
    const { $t } = useScopedI18n(scope, lang);

    expect($t("保存")).toBe("保存");

    lang.value = "en";
    expect($t("保存")).toBe("Save");
  });

  test("$t tagged template 语言切换后反映新翻译", () => {
    const scope = zhScope({ en: { "你好 {{}}": "Hello {{}}" } });
    const lang = ref<Language>("zh_cn");
    const { $t } = useScopedI18n(scope, lang);

    const strings = ["你好 ", ""] as unknown as TemplateStringsArray;

    expect($t(strings, "Alice")).toBe("你好 Alice");

    lang.value = "en";
    expect($t(strings, "Alice")).toBe("Hello Alice");
  });

  test("英文 defaultLanguage 插件：中文翻译", () => {
    const scope = createI18nScope({
      id: "plugin-en",
      defaultLanguage: "en",
      translations: { zh_cn: { "Hello": "你好" } },
    });
    const lang = ref<Language>("zh_cn");
    const { t } = useScopedI18n(scope, lang);

    expect(t("Hello")).toBe("你好");
  });

  test("多插槽 tagged template", () => {
    const scope = zhScope({
      en: { "{{}} has {{}} items": "{{}} 有 {{}} 个项目" },
    });
    const lang = ref<Language>("en");
    const { $t } = useScopedI18n(scope, lang);

    const strings = ["", " has ", " items"] as unknown as TemplateStringsArray;
    expect($t(strings, "Alice", "3")).toBe("Alice 有 3 个项目");
  });
});

// ---- createI18nVue（install 行为） ----

describe("createI18nVue", () => {
  test("install 将 $t 挂载到 globalProperties", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("en");

    const plugin = createI18nVue({ scope, langRef: lang });

    // 模拟 Vue app 的 install 行为
    const globalProperties: Record<string, unknown> = {};
    const mockApp = {
      config: { globalProperties },
    };
    plugin.install(mockApp as Parameters<typeof plugin.install>[0]);

    expect(typeof globalProperties.$t).toBe("function");
    const $t = globalProperties.$t as (key: string) => string;
    expect($t("保存")).toBe("Save");
  });

  test("globalProperties.$t 语言切换后反映新翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = ref<Language>("zh_cn");

    const plugin = createI18nVue({ scope, langRef: lang });

    const globalProperties: Record<string, unknown> = {};
    const mockApp = {
      config: { globalProperties },
    };
    plugin.install(mockApp as Parameters<typeof plugin.install>[0]);

    const $t = globalProperties.$t as (key: string) => string;
    expect($t("保存")).toBe("保存");

    lang.value = "en";
    expect($t("保存")).toBe("Save");
  });

  test("globalProperties.$t 支持 tagged template（多插槽）", () => {
    const scope = zhScope({
      en: { "你好 {{}}，你有 {{}} 条消息": "Hello {{}}, you have {{}} messages" },
    });
    const lang = ref<Language>("en");

    const plugin = createI18nVue({ scope, langRef: lang });
    const globalProperties: Record<string, unknown> = {};
    plugin.install({ config: { globalProperties } } as Parameters<typeof plugin.install>[0]);

    const $t = globalProperties.$t as (
      strings: TemplateStringsArray,
      ...slots: unknown[]
    ) => string;
    const strings = ["你好 ", "，你有 ", " 条消息"] as unknown as TemplateStringsArray;
    expect($t(strings, "Alice", 5)).toBe("Hello Alice, you have 5 messages");
  });
});
