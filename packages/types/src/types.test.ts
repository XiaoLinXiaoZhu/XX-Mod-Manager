// @xxmm/types 测试 — 验证 Parse, Don't Validate 模式
//
// 运行：bun test packages/types/src/types.test.ts

import { describe, test, expect } from "bun:test";
import {
  parseFilePath,
  parseDirPath,
  parseModName,
  parsePresetName,
  parsePluginName,
  parseWindowBounds,
  parseSaveModInfo,
  asFilePath,
  asDirPath,
  asModName,
  asBoundsStr,
} from "./index";

describe("品牌路径类型 parse*", () => {
  test("parseFilePath 合法输入返回品牌值", () => {
    const p = parseFilePath("/some/path");
    expect(typeof p).toBe("string");
    expect(p).toBe("/some/path");
  });

  test("parseFilePath 空字符串抛出", () => {
    expect(() => parseFilePath("")).toThrow();
  });

  test("parseDirPath 合法输入通过", () => {
    const p = parseDirPath("/some/dir");
    expect(p).toBe("/some/dir");
  });

  test("as* 函数零开销（不抛异常，不校验）", () => {
    // as* 应该接受任何 string，包括空字符串
    const p = asFilePath("");
    expect(p).toBe("");
    const d = asDirPath("");
    expect(d).toBe("");
  });
});

describe("品牌名称类型", () => {
  test("parseModName 合法", () => {
    const m = parseModName("MyMod");
    expect(m).toBe("MyMod");
  });

  test("parseModName 空字符串抛出", () => {
    expect(() => parseModName("")).toThrow();
  });

  test("parsePresetName", () => {
    expect(parsePresetName("preset1")).toBe("preset1");
  });

  test("parsePluginName", () => {
    expect(parsePluginName("plugin1")).toBe("plugin1");
  });
});

describe("复合对象 parse*", () => {
  test("parseWindowBounds 解析合法 JSON", () => {
    const s = asBoundsStr('{"x":100,"y":200,"width":800,"height":600}');
    const bounds = parseWindowBounds(s);
    expect(bounds).toEqual({ x: 100, y: 200, width: 800, height: 600 });
  });

  test("parseWindowBounds 缺少字段抛出", () => {
    const s = asBoundsStr('{"x":100}');
    expect(() => parseWindowBounds(s)).toThrow();
  });

  test("parseSaveModInfo 从字符串解析", () => {
    const input = JSON.stringify({
      character: "Diluc",
      preview: "preview.png",
      description: "A mod",
      url: "https://example.com",
      hotkeys: [{ key: "F1", action: "toggle" }],
    });
    const mod = parseSaveModInfo(input);
    expect(mod.character).toBe("Diluc");
    expect(mod.hotkeys).toHaveLength(1);
  });

  test("parseSaveModInfo 从对象解析", () => {
    const mod = parseSaveModInfo({ character: "Diluc" });
    expect(mod.character).toBe("Diluc");
    expect(mod.description).toBeUndefined();
  });

  test("parseSaveModInfo 非法输入抛出", () => {
    expect(() => parseSaveModInfo({ character: 123 })).toThrow();
  });
});

describe("品牌类型互斥", () => {
  test("不同类型的品牌值在运行时都是 string", () => {
    // 运行时没有区别——品牌仅在编译时生效
    const fp = asFilePath("/a");
    const dp = asDirPath("/a");
    const mn = asModName("/a");
    expect(fp === dp).toBe(true);
    expect(fp).toBe(mn);
    // 但 TypeScript 会将它们视为不同类型
  });
});
