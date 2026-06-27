// types.ts — @xxmm/store 数据类型
//
// 应用全局状态的类型定义。单一数据源，使用 @vue/reactivity 的 reactive()，
// 同时支持 Vue 组件响应式绑定和普通 JS 代码直接读写。

// ---- 应用配置（持久化） ----

export interface AppConfig {
  /** 是否首次加载 */
  firstLoad: boolean;
  /** 语言 */
  language: "zh_cn" | "en";
  /** 主题 */
  theme: "dark" | "light" | "auto";
  /** Mod 源路径 */
  modSourcePath: string | null;
  /** Mod 目标路径 */
  modTargetPath: string | null;
  /** 预设路径 */
  presetPath: string | null;
  /** 是否启动时使用上次预设 */
  ifStartWithLastPreset: boolean;
  /** 上次使用的预设名 */
  lastUsedPreset: string | null;
  /** 窗口边界 */
  bounds: AppBounds;
  /** 保持 mod 名称与文件夹名一致 */
  ifKeepModNameAsModFolderName: boolean;
  /** 使用传统应用方式 */
  ifUseTraditionalApply: boolean;
}

export interface AppBounds {
  width: number;
  height: number;
  x: number;
  y: number;
}

// ---- 运行时数据 ----

export interface AppData {
  /** Mod 列表 */
  modList: unknown[];
  /** 预设名列表 */
  presetList: string[];
  /** 角色列表 */
  characterList: string[];
}

// ---- 临时状态（不持久化） ----

export interface AppTemp {
  /** 最后点击的 Mod */
  lastClickedMod: unknown;
  /** 当前 Mod */
  currentMod: unknown;
  /** 当前角色 */
  currentCharacter: string | null;
  /** 当前标签页 */
  currentTab: string;
  /** 当前预设名 */
  currentPreset: string;
  /** 是否已唤醒 */
  wakeUped: boolean;
  /** 关闭时不保存 */
  ifDontSaveOnClose: boolean;
}

// ---- 聚合 Store ----

export interface AppStore {
  config: AppConfig;
  data: AppData;
  temp: AppTemp;
}
