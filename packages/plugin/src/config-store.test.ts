// config-store.test.ts — PluginConfigStore 测试

import { describe, test, expect, vi } from "vitest";
import { createConfigStore, extractDefaults } from "./config-store";
import type { PluginConfigSchema } from "@xxmm/types";

const testSchema: PluginConfigSchema = {
  enabled: { type: "boolean", default: true, name: "启用" },
  maxRetry: { type: "number", default: 3, name: "重试次数" },
  label: { type: "string", default: "hello", name: "标签" },
};

describe("extractDefaults", () => {
  test("提取所有带 default 的字段", () => {
    const d = extractDefaults(testSchema);
    expect(d).toEqual({ enabled: true, maxRetry: 3, label: "hello" });
  });

  test("空 schema → 空对象", () => {
    expect(extractDefaults({})).toEqual({});
  });
});

describe("createConfigStore", () => {
  function setup(saved: Record<string, unknown> = {}) {
    const saveFn = vi.fn(async () => {});
    const store = createConfigStore("test", testSchema, saved, saveFn);
    return { store, saveFn };
  }

  test("get：default 值", () => {
    const { store } = setup();
    expect(store.get("enabled")).toBe(true);
    expect(store.get("maxRetry")).toBe(3);
  });

  test("get：saved 值覆盖 default", () => {
    const { store } = setup({ enabled: false });
    expect(store.get("enabled")).toBe(false);
  });

  test("set + get", () => {
    const { store } = setup();
    store.set("maxRetry", 10);
    expect(store.get("maxRetry")).toBe(10);
  });

  test("set 触发 onChange", () => {
    const { store } = setup();
    const fn = vi.fn();
    store.onChange("maxRetry", fn);
    store.set("maxRetry", 5);
    expect(fn).toHaveBeenCalledWith(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("onChange 返回 unsubscribe", () => {
    const { store } = setup();
    const fn = vi.fn();
    const unsub = store.onChange("enabled", fn);
    store.set("enabled", false);
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    store.set("enabled", true);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("set 自动触发 save（debounce 后）", async () => {
    vi.useFakeTimers();
    const { store, saveFn } = setup();

    store.set("enabled", false);
    expect(saveFn).not.toHaveBeenCalled(); // 尚未到 debounce

    vi.advanceTimersByTime(300);
    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );

    vi.useRealTimers();
  });

  test("多次 set 只触发一次 save（debounce 合并）", async () => {
    vi.useFakeTimers();
    const { store, saveFn } = setup();

    store.set("enabled", false);
    store.set("maxRetry", 10);
    store.set("label", "world");
    vi.advanceTimersByTime(300);

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, maxRetry: 10, label: "world" }),
    );

    vi.useRealTimers();
  });

  test("手动 save() 立即写入，跳过 debounce", async () => {
    vi.useFakeTimers();
    const { store, saveFn } = setup();

    store.set("enabled", false);
    await store.save();

    expect(saveFn).toHaveBeenCalledTimes(1); // 立即写入
    vi.advanceTimersByTime(300);
    expect(saveFn).toHaveBeenCalledTimes(1); // 没有第二次

    vi.useRealTimers();
  });
});
