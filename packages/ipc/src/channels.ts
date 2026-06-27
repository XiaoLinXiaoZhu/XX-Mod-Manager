// channels.ts — 所有 IPC channel 集中定义（使用 @xxmm/types 精准类型）

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

  lifecycle: {
    wakeUp: p("wakeUp"),
    windowBlur: p("windowBlur"),
    windowFocus: p("windowFocus"),
  },
} as const;
