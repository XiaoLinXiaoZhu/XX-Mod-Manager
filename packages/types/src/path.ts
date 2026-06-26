// path.ts — 路径类型（Parse, Don't Validate）
//
// 每种路径类型提供三个产物：
//   1. Zod schema     — 运行时校验（用于 parsePath）
//   2. TS 类型        — 编译时区分语义（从 schema 推导）
//   3. parse* / as*   — parse 在边界收窄，as 用于构造端零开销断言

import { z } from "zod";

// ---- FilePath：文件路径 ----

export const FilePath = z.string().min(1).brand<"FilePath">();
export type FilePath = z.infer<typeof FilePath>;

/** 边界处解析：运行时校验 + 类型收窄 */
export const parseFilePath = (s: string): FilePath => FilePath.parse(s);

/** 构造端断言：编译时类型转换（零开销，信任调用者） */
export const asFilePath = (s: string): FilePath => s as FilePath;

// ---- DirPath：目录路径 ----

export const DirPath = z.string().min(1).brand<"DirPath">();
export type DirPath = z.infer<typeof DirPath>;
export const parseDirPath = (s: string): DirPath => DirPath.parse(s);
export const asDirPath = (s: string): DirPath => s as DirPath;

// ---- ModSourcePath：Mod 源目录 ----

export const ModSourcePath = z.string().min(1).brand<"ModSourcePath">();
export type ModSourcePath = z.infer<typeof ModSourcePath>;
export const parseModSourcePath = (s: string): ModSourcePath =>
  ModSourcePath.parse(s);
export const asModSourcePath = (s: string): ModSourcePath =>
  s as ModSourcePath;

// ---- ModTargetPath：Mod 目标目录 ----

export const ModTargetPath = z.string().min(1).brand<"ModTargetPath">();
export type ModTargetPath = z.infer<typeof ModTargetPath>;
export const parseModTargetPath = (s: string): ModTargetPath =>
  ModTargetPath.parse(s);
export const asModTargetPath = (s: string): ModTargetPath =>
  s as ModTargetPath;

// ---- ImagePath：图片路径 ----

export const ImagePath = z.string().min(1).brand<"ImagePath">();
export type ImagePath = z.infer<typeof ImagePath>;
export const parseImagePath = (s: string): ImagePath => ImagePath.parse(s);
export const asImagePath = (s: string): ImagePath => s as ImagePath;
