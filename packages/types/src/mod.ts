// mod.ts — Mod 相关类型

import { z } from "zod";

// ---- ModName：Mod 名称 ----

export const ModName = z.string().min(1).brand<"ModName">();
export type ModName = z.infer<typeof ModName>;
export const parseModName = (s: string): ModName => ModName.parse(s);
export const asModName = (s: string): ModName => s as ModName;

// ---- ModField：Mod 元数据字段名 ----

export const ModField = z.string().min(1).brand<"ModField">();
export type ModField = z.infer<typeof ModField>;
export const parseModField = (s: string): ModField => ModField.parse(s);
export const asModField = (s: string): ModField => s as ModField;

// ---- ModMetaValue：Mod 元数据字段值 ----

export const ModMetaValue: z.ZodType<unknown> = z.unknown();
export type ModMetaValue = unknown;

// ---- Hotkey：快捷键定义 ----

export const Hotkey = z.record(z.string(), z.string());
export type Hotkey = z.infer<typeof Hotkey>;

// ---- SaveModInfo：保存 Mod 信息时的输入 ----

export const SaveModInfo = z.object({
  character: z.string().optional(),
  preview: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  hotkeys: z.array(Hotkey).optional(),
});
export type SaveModInfo = z.infer<typeof SaveModInfo>;

/** 边界处解析 SaveModInfo（接受 JSON 字符串或对象） */
export const parseSaveModInfo = (
  input: string | unknown,
): SaveModInfo => {
  if (typeof input === "string") {
    return SaveModInfo.parse(JSON.parse(input));
  }
  return SaveModInfo.parse(input);
};

// ---- ModInfo：完整 Mod 元数据 ----

export const ModInfo = z.object({
  id: z.string().min(1),
  location: z.string(),
  modName: z.string(),
  character: z.string().optional(),
  preview: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  hotkeys: z.array(Hotkey).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});
export type ModInfo = z.infer<typeof ModInfo>;

/** 边界处解析 ModInfo */
export const parseModInfo = (input: unknown): ModInfo => ModInfo.parse(input);

// ---- GetFilesResult ----

export const GetFilesResult = z.object({
  state: z.number(),
  ret: z.array(z.string()),
});
export type GetFilesResult = z.infer<typeof GetFilesResult>;
