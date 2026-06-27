// @xxmm/helper — 辅助工具包 barrel 导出

export { DialogHelper, DialogID } from "./DialogHelper";
export { EventSystem, EventType } from "./EventSystem";
export { ImageHelper } from "./ImageHelper";
export { Language, setCurrentLanguage, TranslatedText } from "./Language";
export { PathHelper } from "./PathHelper";
export { joinPath, basename, startsWith, stripPrefix, addPrefix } from "./PathUtil";
export {
  IPlugin,
  IPluginData,
  IPluginDataTypes,
  IPluginLoader,
  IPluginOption,
} from "./PluginLoader";
export { SnackType, snack, t_snack } from "./SnackHelper";
export { XManager } from "./XManager";

// i18n
export { appI18n, appScope, langState } from "./I18nConfig";
