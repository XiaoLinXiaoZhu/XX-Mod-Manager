// types.ts — @xxmm/plugin 核心类型
//
// PluginContext 在此定义（而非 @xxmm/types），因为需要依赖
// @xxmm/ipc、@xxmm/events、@xxmm/i18n 的真实类型。

import type { IPC } from "@xxmm/ipc";
import type { IPCClient } from "@xxmm/ipc";
import type { EventBus } from "@xxmm/events";
import type { I18nFn, LanguageState } from "@xxmm/i18n";
import type {
  PluginManifest,
  Plugin,
  PluginConfigSchema,
} from "@xxmm/types";

// ---- re-export for plugin authors ----
export type { PluginManifest, Plugin, PluginConfigSchema } from "@xxmm/types";

// ---- PluginContext ----

export interface PluginContext {
  /** scoped i18n：i18n("key") 或 i18n`模板` */
  i18n: I18nFn;

  /** 类型安全 IPC（直接暴露，不做包装） */
  ipc: IPCClient<typeof IPC>;

  /** 类型安全进程内事件（共享全局 EventBus） */
  events: EventBus;

  /** 插件配置读写 */
  config: PluginConfigStore;

  /** UI 注册 */
  ui: PluginUIRegistry;

  /** 结构化日志 */
  log: PluginLogger;

  /** 通知提示（message 已经过 i18n） */
  snack: (message: string, type?: "info" | "error" | "warning") => void;
}

// ---- PluginConfigStore ----

export interface PluginConfigStore {
  /** 读取配置值 */
  get<T = unknown>(key: string): T;

  /** 写入配置值（仅内存，需调用 save() 持久化） */
  set<T = unknown>(key: string, value: T): void;

  /** 持久化到磁盘 */
  save(): Promise<void>;

  /** 监听配置变更，返回 unsubscribe */
  onChange(key: string, fn: (value: unknown) => void): () => void;
}

// ---- PluginUIRegistry ----

export interface PluginUIRegistry {
  /** 在工具栏添加按钮（SVG icon + label + click handler） */
  addToolbarButton(options: {
    icon: string;
    label: string;
    onClick: () => void;
  }): void;
}

// ---- PluginLogger ----

export interface PluginLogger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

// ---- LoadedPlugin：加载完成的插件 ----

export interface LoadedPlugin {
  manifest: PluginManifest;
  module: Plugin;
  i18nScope: { readonly id: string };
  /** 插件目录路径 */
  dir: string;
}

// ---- PluginHost：主进程侧接口 ----

export interface PluginHost {
  /** 扫描插件目录，返回所有 manifest */
  scan(rootDirs: string[]): Promise<PluginManifest[]>;

  /** 加载单个插件：读 manifest → 读 main.ts → 转译 → 返回 LoadedPlugin */
  load(manifest: PluginManifest, pluginDir: string): Promise<LoadedPlugin>;

  /** 卸载插件 */
  unload(pluginId: string): void;

  /** 获取已加载的插件列表 */
  loaded(): ReadonlyMap<string, LoadedPlugin>;
}

// ---- PluginServices：构造 PluginContext 所需的依赖 ----

export interface PluginServices {
  ipc: IPCClient<typeof IPC>;
  events: EventBus;
  langState: LanguageState;
  /** 从磁盘加载配置 */
  loadConfig(pluginId: string): Promise<Record<string, unknown>>;
  /** 保存配置到磁盘 */
  saveConfig(pluginId: string, data: Record<string, unknown>): Promise<void>;
}
