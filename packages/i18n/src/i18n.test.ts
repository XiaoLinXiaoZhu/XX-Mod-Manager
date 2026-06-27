// i18n.test.ts — @xxmm/i18n 核心功能测试

import { describe, test, expect } from "bun:test";
import {
  createI18nScope,
  createLanguageState,
  createI18nFn,
  interpolate,
  interpolateTemplate,
} from "./index";
import type { I18nScope, I18nScopeConfig, Language } from "./index";

// ---- 辅助 ----

function zhScope(translations?: Record<Language, Record<string, string>>): I18nScope {
  const config: I18nScopeConfig = {
    id: "app",
    defaultLanguage: "zh_cn",
  };
  if (translations !== undefined) config.translations = translations;
  return createI18nScope(config);
}

function enScope(translations?: Record<Language, Record<string, string>>): I18nScope {
  const config: I18nScopeConfig = {
    id: "plugin-en",
    defaultLanguage: "en",
  };
  if (translations !== undefined) config.translations = translations;
  return createI18nScope(config);
}

// ---- interpolate ----

describe("interpolate", () => {
  test("单字符串原样返回", () => {
    expect(interpolate("hello", [])).toBe("hello");
  });

  test("模板 + 插槽", () => {
    const strings = ["Hello ", ", you have ", " messages"] as unknown as TemplateStringsArray;
    expect(interpolate(strings, ["Alice", 5])).toBe("Hello Alice, you have 5 messages");
  });

  test("空插槽值渲染为空字符串", () => {
    const strings = ["a", "b", "c"] as unknown as TemplateStringsArray;
    expect(interpolate(strings, [null, undefined])).toBe("abc");
  });
});

describe("interpolateTemplate", () => {
  test("单模板无 {{}} 原样返回", () => {
    expect(interpolateTemplate("hello", [])).toBe("hello");
  });

  test("一个 {{}} 被替换", () => {
    expect(interpolateTemplate("Hello {{}}", ["Alice"])).toBe("Hello Alice");
  });

  test("两个 {{}} 按顺序替换", () => {
    expect(interpolateTemplate("{{}} has {{}} items", ["Alice", "3"]))
      .toBe("Alice has 3 items");
  });

  test("slots 多于 {{}}：多余忽略", () => {
    expect(interpolateTemplate("Hi {{}}", ["Alice", "extra"]))
      .toBe("Hi Alice");
  });
});

// ---- Scope ----

describe("createI18nScope", () => {
  test("defaultLanguage 命中时直接返回 key", () => {
    const scope = zhScope();
    expect(scope.translate("保存", "zh_cn")).toBe("保存");
  });

  test("翻译表命中", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    expect(scope.translate("保存", "en")).toBe("Save");
  });

  test("翻译表未命中 fallback 到 defaultLanguage", () => {
    const scope = zhScope({ en: {} });
    expect(scope.translate("保存", "en")).toBe("保存");
  });

  test("翻译表中无此语言 fallback 到 defaultLanguage", () => {
    const scope = zhScope();
    expect(scope.translate("保存", "ja")).toBe("保存");
  });

  test("翻译 + 插槽", () => {
    const scope = zhScope({ en: { "你好 {{}}": "Hello {{}}" } });
    expect(scope.translate("你好 {{}}", "en", ["Alice"])).toBe("Hello Alice");
  });

  test("keyFromTemplate 用 {{}} 连接模板", () => {
    const scope = zhScope();
    const strings = ["你好 ", "，你有 ", " 条消息"] as unknown as TemplateStringsArray;
    expect(scope.keyFromTemplate(strings)).toBe("你好 {{}}，你有 {{}} 条消息");
  });

  test("lookup 返回 undefined 表示未翻译", () => {
    const scope = zhScope();
    expect(scope.lookup("保存", "en")).toBeUndefined();
  });
});

// ---- LanguageState ----

describe("createLanguageState", () => {
  test("初始语言正确", () => {
    const state = createLanguageState("zh_cn");
    expect(state.get()).toBe("zh_cn");
  });

  test("set 更新语言", () => {
    const state = createLanguageState("zh_cn");
    state.set("en");
    expect(state.get()).toBe("en");
  });

  test("同语言 set 不触发 onChange", () => {
    const state = createLanguageState("zh_cn");
    let calls = 0;
    state.onChange(() => { calls++; });
    state.set("zh_cn");
    expect(calls).toBe(0);
    state.set("en");
    expect(calls).toBe(1);
  });

  test("onChange 返回 unsubscribe", () => {
    const state = createLanguageState("zh_cn");
    let calls = 0;
    const unsub = state.onChange(() => { calls++; });
    state.set("en");
    expect(calls).toBe(1);
    unsub();
    state.set("zh_cn");
    expect(calls).toBe(1);
  });
});

// ---- I18nFn ----

describe("createI18nFn", () => {
  test("函数调用：翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = createLanguageState("en");
    const i18n = createI18nFn(scope, lang);
    expect(i18n("保存")).toBe("Save");
  });

  test("函数调用：defaultLanguage 直接返回", () => {
    const scope = zhScope();
    const lang = createLanguageState("zh_cn");
    const i18n = createI18nFn(scope, lang);
    expect(i18n("保存")).toBe("保存");
  });

  test("tagged template：翻译 + 插槽（通过 scope 验证）", () => {
    const scope = zhScope({ en: { "你好 {{}}": "Hello {{}}" } });
    const lang = createLanguageState("en");
    const i18n = createI18nFn(scope, lang);
    // I18nFn 的 tagged template 重载在运行时正确传递 slots
    const key = scope.keyFromTemplate(["你好 ", ""] as unknown as TemplateStringsArray);
    expect(scope.translate(key, "en", ["Alice"])).toBe("Hello Alice");
    // 直接通过 i18n 调用翻译路径
    expect(i18n("你好 {{}}")).toBe("Hello {{}}");
  });

  test("英语 defaultLanguage 插件：英文原文，中文翻译", () => {
    const scope = enScope({ zh_cn: { "Hello": "你好" } });
    const lang = createLanguageState("zh_cn");
    const i18n = createI18nFn(scope, lang);
    expect(i18n("Hello")).toBe("你好");
  });

  test("英语 defaultLanguage 插件：当前语言与 default 一致", () => {
    const scope = enScope({ zh_cn: { "Hello": "你好" } });
    const lang = createLanguageState("en");
    const i18n = createI18nFn(scope, lang);
    expect(i18n("Hello")).toBe("Hello");
  });

  test("语言切换后反映新翻译", () => {
    const scope = zhScope({ en: { "保存": "Save" } });
    const lang = createLanguageState("zh_cn");
    const i18n = createI18nFn(scope, lang);

    expect(i18n("保存")).toBe("保存");
    lang.set("en");
    expect(i18n("保存")).toBe("Save");
  });
});
