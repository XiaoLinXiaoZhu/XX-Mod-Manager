// @xxmm/types — 共享类型定义（Parse, Don't Validate）

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
export type {
  PluginManifest,
  Plugin,
  PluginConfigSchema,
  PluginConfigField,
  PluginBooleanField,
  PluginStringField,
  PluginNumberField,
  PluginPathField,
  PluginSelectField,
  PluginSelectOption,
  PluginButtonField,
  PluginMarkdownField,
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
