// channels.ts — 所有 IPC channel 集中定义（使用 @xxmm/types 精准类型）
//
// NOTE: hmc.* channels 仅在 Windows 上可用。
// 非 Windows 平台 handler 返回空值/无操作，插件需自行处理降级。
// 这是设计选择——不在类型层面表达平台差异，保持 channel 定义简洁。

import { h, s, p } from "./channel";
import type {
  FilePath,
  DirPath,
  ModSourcePath,
  ModTargetPath,
  ImagePath,
  ModName,
  ModField,
  SaveModInfo,
  ModInfo,
  GetFilesResult,
  PresetName,
  AppConfig,
  BoundsStr,
  PluginName,
  PluginConfig,
  DisabledPlugins,
  GetArgsResult,
  CustomConfigFolder,
  WindowArg,
  SnackType,
  IManagerRef,
  HmcProcess,
  FsWatchEvent,
} from "@xxmm/types";

export const IPC = {
  window: {
    minimize: h<[], void>("minimize-window"),
    maximize: h<[], void>("maximize-window"),
    close: h<[], void>("close-window"),
    toggleFullscreen: h<[], boolean>("toggle-fullscreen"),
    pin: h<[], boolean>("pin-window"),
    unpin: h<[], boolean>("unpin-window"),
    setBounds: h<[boundsStr: BoundsStr], void>("set-bounds"),
  },

  fs: {
    readFile: h<[path: FilePath], string>("fs-read-file"),
    writeFile: h<[path: FilePath, data: string], void>("fs-write-file"),
    createFile: h<[path: FilePath], void>("fs-create-file"),
    readDir: h<[path: DirPath], string[]>("fs-read-dir"),
    isDir: h<[path: DirPath], boolean>("fs-is-dir"),
    exists: h<[path: FilePath], boolean>("fs-exists"),
    mkdir: h<[path: DirPath], void>("fs-mkdir"),
    remove: h<[path: FilePath], void>("fs-remove"),
    symlink: h<[src: FilePath, dest: FilePath, type?: string], void>("fs-symlink"),
    copyFile: h<[src: FilePath, dest: FilePath], void>("fs-copy-file"),
    openDir: h<[path: DirPath], void>("fs-open-dir"),
    getFilePath: h<
      [fileName: string, fileType: string, defaultPath: string],
      string
    >("get-file-path"),
    /** 开始监听目录变更，返回 watcherId（用于 unwatch）。变更通过 fileChanged push channel 通知 */
    watch: h<[dirPath: DirPath, recursive?: boolean], string>("fs-watch"),
    /** 停止监听 */
    unwatch: h<[watcherId: string], void>("fs-unwatch"),
  },

  app: {
    getArgs: h<[], GetArgsResult>("get-args"),
    getUserDataPath: h<[], string>("get-user-data-path"),
    getAppPath: h<[], string>("get-app-path"),
    getDesktopPath: h<[], string>("get-desktop-path"),
    openUrl: h<[url: string], void>("open-url"),
    initAllData: h<[], void>("init-all-data"),
    getArgsSync: s("get-args-sync"),
    mainWindowReady: s("main-window-ready"),
    getUserDataPathSync: s("get-user-data-path-sync"),
    snack: s<[message: string, type?: SnackType]>("snack"),
    snackPush: p<[message: string, type?: SnackType]>("snack"),
  },

  config: {
    get: h<[], AppConfig>("get-current-config"),
    set: h<[config: AppConfig], void>("set-current-config"),
    setCustomFolder: h<[folder: CustomConfigFolder], void>("set-custom-config-folder"),
    setCustomFolderSend: s<[folder: CustomConfigFolder]>("set-custom-config-folder"),
  },

  mod: {
    list: h<[source: ModSourcePath], ModInfo[]>("get-mods"),
    listFromCurrentConfig: h<[], ModInfo[]>("get-mods-from-current-config"),
    getInfo: h<[source: ModSourcePath, name: ModName], ModInfo>("get-mod-info"),
    setInfo: h<[modPath: DirPath, field: ModField, value: unknown], void>("set-mod-info"),
    saveInfo: h<[source: ModSourcePath, json: string], void>("save-mod-info"),
    getImage: h<[path: ImagePath], string>("get-image"),
    getFiles: h<[dirPath: DirPath], GetFilesResult>("getFiles"),
    apply: h<[mods: ModName[], src: ModSourcePath, dest: ModTargetPath], void>("apply-mods"),
    moveAllFiles: h<[src: DirPath, dest: DirPath], void>("move-all-files"),
    openNewWindow: s<[arg: WindowArg]>("open-new-window"),
    refresh: s("refresh-main-window"),
  },

  preset: {
    list: h<[], PresetName[]>("get-preset-list"),
    load: h<[name: PresetName], ModName[]>("load-preset"),
    save: h<[name: PresetName, mods: ModName[]], void>("save-preset"),
  },

  plugin: {
    saveConfig: h<[name: PluginName, config: PluginConfig], void>("save-plugin-config"),
    getConfig: h<[name: PluginName], PluginConfig>("get-plugin-config"),
    saveDisabled: h<[plugins: DisabledPlugins], void>("save-disabled-plugins"),
    getDisabled: h<[], DisabledPlugins>("get-disabled-plugins"),
    setIManager: h<[ref: IManagerRef], void>("set-imanager"),
  },

  /**
   * HMC（Hardware Mouse Control）— Windows 原生输入 API。
   * NOTE: 仅在 Windows 上可用（依赖 hmc-win32 原生模块）。
   * 暴露低层 API 而非高层封装——插件自行组合刷新逻辑。
   * 详见 apps/electron/src/hmcHandler.js 的注释。
   */
  hmc: {
    getProcessList: h<[name: string], HmcProcess[]>("hmc-get-process-list"),
    getProcessWindow: h<[pid: number], number | null>("hmc-get-process-window"),
    getForegroundWindow: h<[], number>("hmc-get-foreground-window"),
    sendKey: h<[vk: number, down: boolean], void>("hmc-send-key"),
    setFocus: h<[hwnd: number], void>("hmc-set-focus"),
  },

  lifecycle: {
    wakeUp: p("wakeUp"),
    windowBlur: p("windowBlur"),
    windowFocus: p("windowFocus"),
    /** 文件监听变更推送（主→渲染）。payload: [watcherId, events[]] */
    fileChanged: p<[watcherId: string, changes: FsWatchEvent[]]>("fs-file-changed"),
  },
} as const;
