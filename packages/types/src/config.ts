// config.ts — 配置相关类型

import { z } from "zod";

// ---- PresetName：预设名称 ----

export const PresetName = z.string().min(1).brand<"PresetName">();
export type PresetName = z.infer<typeof PresetName>;
export const parsePresetName = (s: string): PresetName => PresetName.parse(s);
export const asPresetName = (s: string): PresetName => s as PresetName;

// ---- AppConfig：应用配置（松散 record）----

export const AppConfig = z.record(z.string(), z.unknown());
export type AppConfig = z.infer<typeof AppConfig>;

/** 边界处解析应用配置 */
export const parseAppConfig = (input: unknown): AppConfig =>
  AppConfig.parse(input);

// ---- BoundsStr：窗口位置尺寸 JSON 字符串 ----
// 格式：'{"x":100,"y":200,"width":800,"height":600}'

export const BoundsStr = z.string().min(1).brand<"BoundsStr">();
export type BoundsStr = z.infer<typeof BoundsStr>;
export const parseBoundsStr = (s: string): BoundsStr => BoundsStr.parse(s);
export const asBoundsStr = (s: string): BoundsStr => s as BoundsStr;

// ---- WindowBounds：解析后的窗口位置尺寸 ----

export const WindowBounds = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type WindowBounds = z.infer<typeof WindowBounds>;

/** 从 BoundsStr JSON 解析为 WindowBounds */
export const parseWindowBounds = (s: BoundsStr | string): WindowBounds =>
  WindowBounds.parse(typeof s === "string" ? JSON.parse(s) : s);
