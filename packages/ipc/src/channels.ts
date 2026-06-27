// channels.ts — 所有 IPC channel 集中定义（使用 @xxmm/types 精准类型）
//
// Parse, Don't Validate：
//   - 渲染进程用 as* 函数构造品牌值（编译时断言，零开销）
//   - 主进程用 parse* 函数在边界校验（运行时验证 + 类型收窄）
//
// 使用方式：
//   渲染进程:
//     import { createClient } from "@xxmm/ipc";
//     import { asFilePath, asModSourcePath } from "@xxmm/types";
//     const ipc = createClient(IPC);
//     await ipc.fs.readFile(asFilePath("/path"));
//     await ipc.mod.list(asModSourcePath("/mods"));
//
//   主进程:
//     import { createIPCMain } from "@xxmm/ipc";
//     import { parseFilePath, GetArgsResult } from "@xxmm/types";
//     const ipc = createIPCMain();
//     ipc.handle(IPC.fs.readFile, async (event, path) => {
//       const safe = parseFilePath(path);  // 边界校验 + 收窄
//       return fs.readFileSync(safe, "utf-8");
//     });

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

// ===== IPC channel 定义树 =====

export const IPC = {
  // ---- 窗口控制 ----
  window: {
    minimize: h<[], void>("minimize-window"),
    maximize: h<[], void>("maximize-window"),
    close: h<[], void>("close-window"),
    toggleFullscreen: h<[], boolean>("toggle-fullscreen"),
    pin: h<[], boolean>("pin-window"),
    unpin: h<[], boolean>("unpin-window"),
    /** bounds JSON: { x, y, width, height } */
    setBounds: h<[boundsStr: BoundsStr], void>("set-bounds"),
  },

  // ---- 文件系统代理 ----
  fs: {
    readFile: h<[path: FilePath], string>("fs-read-file"),
    writeFile: h<[path: FilePath, data: string], void>("fs-write-file"),
    createFile: h<[path: FilePath], void>("fs-create-file"),
    readDir: h<[path: DirPath], string[]>("fs-read-dir"),
    isDir: h<[path: DirPath], boolean>("fs-is-dir"),
    openDir: h<[path: DirPath], void>("fs-open-dir"),
    /** 打开文件选择对话框，返回选中路径 */
    getFilePath: h<
      [fileName: string, fileType: string, defaultPath: string],
      string
    >("get-file-path"),
  },

  // ---- 应用级 ----
  app: {
    getArgs: h<[], GetArgsResult>("get-args"),
    getUserDataPath: h<[], string>("get-user-data-path"),
    getAppPath: h<[], string>("get-app-path"),
    getDesktopPath: h<[], string>("get-desktop-path"),
    openUrl: h<[url: string], void>("open-url"),
    initAllData: h<[], void>("init-all-data"),

    // send 模式（渲染→主单向）
    getArgsSync: s("get-args-sync"),
    mainWindowReady: s("main-window-ready"),
    getUserDataPathSync: s("get-user-data-path-sync"),
    snack: s<[message: string, type?: SnackType]>("snack"),

    // push 模式（主→渲染广播）
    // NOTE: snack 同时有 send（渲染→主）和 push（主→渲染）两个方向，
    // 使用同一 channel 名 "snack"，由主进程 snack handler 转发。
    snackPush: p<[message: string, type?: SnackType]>("snack"),
  },

  // ---- 配置管理 ----
  config: {
    get: h<[], AppConfig>("get-current-config"),
    set: h<[config: AppConfig], void>("set-current-config"),
    setCustomFolder: h<[folder: CustomConfigFolder], void>(
      "set-custom-config-folder",
    ),
    setCustomFolderSend: s<[folder: CustomConfigFolder]>(
      "set-custom-config-folder",
    ),
  },

  // ---- Mod 管理 ----
  mod: {
    /** 返回完整的 ModInfo 列表（含 preview、character 等） */
    list: h<[source: ModSourcePath], ModInfo[]>("get-mods"),
    listFromCurrentConfig: h<[], ModInfo[]>("get-mods-from-current-config"),
    getInfo: h<
      [source: ModSourcePath, name: ModName],
      ModInfo
    >("get-mod-info"),
    setInfo: h<[modPath: DirPath, field: ModField, value: unknown], void>(
      "set-mod-info",
    ),
    saveInfo: h<[source: ModSourcePath, json: string], void>("save-mod-info"),
    getImage: h<[path: ImagePath], string>("get-image"),
    getFiles: h<[dirPath: DirPath], GetFilesResult>("getFiles"),
    apply: h<[mods: ModName[], src: ModSourcePath, dest: ModTargetPath], void>(
      "apply-mods",
    ),
    moveAllFiles: h<[src: DirPath, dest: DirPath], void>("move-all-files"),

    // send
    openNewWindow: s<[arg: WindowArg]>("open-new-window"),
    refresh: s("refresh-main-window"),
  },

  // ---- 预设 ----
  preset: {
    list: h<[], PresetName[]>("get-preset-list"),
    load: h<[name: PresetName], ModName[]>("load-preset"),
    save: h<[name: PresetName, mods: ModName[]], void>("save-preset"),
  },

  // ---- 插件 ----
  plugin: {
    saveConfig: h<[name: PluginName, config: PluginConfig], void>(
      "save-plugin-config",
    ),
    getConfig: h<[name: PluginName], PluginConfig>("get-plugin-config"),
    saveDisabled: h<[plugins: DisabledPlugins], void>(
      "save-disabled-plugins",
    ),
    getDisabled: h<[], DisabledPlugins>("get-disabled-plugins"),
    setIManager: h<[ref: IManagerRef], void>("set-imanager"),
  },

  // ---- 生命周期（主→渲染推送）----
  lifecycle: {
    wakeUp: p("wakeUp"),
    windowBlur: p("windowBlur"),
    windowFocus: p("windowFocus"),
  },
} as const;
