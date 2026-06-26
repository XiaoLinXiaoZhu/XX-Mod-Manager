// app.ts — 应用级通用类型

import { z } from "zod";

// ---- GetArgsResult：IPC get-args 返回值 ----

export const GetArgsResult = z.object({
  devMode: z.boolean(),
  firstpage: z.boolean(),
  switchConfig: z.boolean(),
  devTools: z.boolean(),
  ifCustomConfig: z.boolean(),
  customConfigFolder: z.string(),
});
export type GetArgsResult = z.infer<typeof GetArgsResult>;

// ---- CustomConfigFolder：自定义配置文件夹路径 ----

export const CustomConfigFolder = z.string().min(1).brand<"CustomConfigFolder">();
export type CustomConfigFolder = z.infer<typeof CustomConfigFolder>;
export const parseCustomConfigFolder = (s: string): CustomConfigFolder =>
  CustomConfigFolder.parse(s);
export const asCustomConfigFolder = (s: string): CustomConfigFolder =>
  s as CustomConfigFolder;

// ---- WindowArg：open-new-window 参数 ----

export const WindowArg = z.enum(["firstLoad", "switchConfig"]);
export type WindowArg = z.infer<typeof WindowArg>;

/** 边界处解析窗口参数 */
export const parseWindowArg = (s: string): WindowArg => WindowArg.parse(s);

// ---- SnackType：snack 通知类型 ----

export const SnackType = z.enum(["info", "warn", "error"]).default("info");
export type SnackType = z.infer<typeof SnackType>;

// ---- IManagerRef：set-imanager 不透明引用 ----

export type IManagerRef = unknown;
