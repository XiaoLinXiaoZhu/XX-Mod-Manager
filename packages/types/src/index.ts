// @xxmm/types — 共享类型定义（Parse, Don't Validate）
//
// 每种类型同时导出 zod schema 和 TS 类型（同名，利用 TS 值/类型双命名空间）：
//   import { FilePath, parseFilePath, asFilePath } from "@xxmm/types";
//   const p: FilePath = FilePath.parse("hello");  // 左值=类型，右值=schema

export type { Branded } from "./brand";

export {
  FilePath,
  DirPath,
  ModSourcePath,
  ModTargetPath,
  ImagePath,
  parseFilePath,
  parseDirPath,
  parseModSourcePath,
  parseModTargetPath,
  parseImagePath,
  asFilePath,
  asDirPath,
  asModSourcePath,
  asModTargetPath,
  asImagePath,
} from "./path";

export {
  ModName,
  ModField,
  ModInfo,
  SaveModInfo,
  GetFilesResult,
  parseModName,
  parseModField,
  parseModInfo,
  parseSaveModInfo,
  asModName,
  asModField,
} from "./mod";
export type { ModMetaValue, Hotkey } from "./mod";

export {
  PresetName,
  AppConfig,
  BoundsStr,
  WindowBounds,
  parsePresetName,
  parseAppConfig,
  parseBoundsStr,
  parseWindowBounds,
  asPresetName,
  asBoundsStr,
} from "./config";

export {
  PluginName,
  PluginConfig,
  DisabledPlugins,
  parsePluginName,
  parsePluginConfig,
  asPluginName,
} from "./plugin";

export {
  GetArgsResult,
  CustomConfigFolder,
  WindowArg,
  SnackType,
  parseCustomConfigFolder,
  parseWindowArg,
  asCustomConfigFolder,
} from "./app";
export type { IManagerRef } from "./app";
