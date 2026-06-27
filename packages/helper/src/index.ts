// @xxmm/helper — 辅助工具包 barrel 导出

export { DialogHelper, DialogID } from "./DialogHelper";
export { ImageHelper } from "./ImageHelper";
export { joinPath, basename, startsWith, stripPrefix, addPrefix } from "./PathUtil";
export { XManager } from "./XManager";

// i18n
export { appI18n, appScope, langState } from "./I18nConfig";

// 兼容层（TODO: 迁移完成后删除以下导出）
export { TranslatedText, setCurrentLanguage } from "./Language";
export { snack, t_snack, SnackType } from "./SnackHelper";
export type { SnackTypeValue } from "./SnackHelper";
export { IPluginLoader } from "./PluginLoader";
