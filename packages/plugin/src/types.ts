// types.ts — @xxmm/plugin 核心类型
//
// PluginContext 在此定义（而非 @xxmm/types），因为需要依赖
// @xxmm/ipc、@xxmm/events、@xxmm/i18n 的真实类型。
//
// === 架构决策 ===
//
// PluginUIRegistry 极简设计：只有 addCss / removeCss / showDialog / dismissDialog。
// 不提供 addToolbarButton、addDialogAction、addEventListener 等高层封装。
//
// 理由：
// 1. Electron 的 nodeIntegration + contextIsolation=false 下，插件已有 document 访问权。
//    额外封装只是增加维护负担和限制灵活性。
// 2. 旧架构（IManager god object）的问题不是"插件操作 DOM"，
//    而是 require('fs')、require('electron') 等系统访问没有类型安全边界。
//    ctx.ipc、ctx.events、ctx.config、ctx.snack 已经解决了这些问题。
// 3. 每多一层 UI 封装，就需要维护一个新的 API 表面。
//    插件作者自己 document.createElement + querySelector 更灵活，不需要学新 API。
//
// 否决的替代方案：
// - addToolbarButton / removeToolbarButton：插件直接用 document 在工具栏注入按钮
// - addDialogAction：插件用 document.querySelector + insertBefore 在对话框中注入按钮
// - addEventListener 封装：插件用 document.querySelectorAll + addEventListener 绑定事件
// - patchSchema 通用方法：用更简单的 refreshSchema() 替代

import type { IPC } from "@xxmm/ipc";
import type { IPCClient } from "@xxmm/ipc";
import type { EventBus } from "@xxmm/events";
import type { I18nFn, LanguageState } from "@xxmm/i18n";
import type {
  PluginManifest,
  Plugin,
  PluginConfigSchema,
  PluginConfigField,
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

  /** UI 薄封装（CSS、对话框）—— DOM 操作请直接用 document */
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

  /** 写入配置值（自动 debounce 持久化） */
  set<T = unknown>(key: string, value: T): void;

  /** 立即持久化到磁盘 */
  save(): Promise<void>;

  /** 监听配置变更，返回 unsubscribe */
  onChange(key: string, fn: (value: unknown) => void): () => void;

  /**
   * 通知 UI 层重新读取 configSchema。
   * 插件自行修改 configSchema 对象后调用此方法触发 UI 重渲染。
   * 典型场景：动态更新 select 的 options（如 changCharacterPlugin）。
   *
   * 实现：emit(AppEvents.pluginSchemaChanged, pluginId)。
   * WIP: UI 层（settingSection.vue）的监听尚未实现。
   */
  refreshSchema(): void;
}

// ---- PluginUIRegistry ----
//
// 极简设计：只封装纯 DOM 做起来难受的操作。
// 工具栏按钮、对话框内注入、事件绑定——直接用 document。

export interface PluginUIRegistry {
  /** 注入 CSS（基于内容哈希自动去重），返回 id 用于后续移除 */
  addCss(css: string): string;

  /** 移除之前注入的 CSS */
  removeCss(id: string): void;

  /** 显示对话框（document.getElementById(id).show() 的薄封装） */
  showDialog(dialogId: string): void;

  /** 关闭对话框 */
  dismissDialog(dialogId: string): void;
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
  /** 渲染进程提供的 UI 注册实现 */
  ui: PluginUIRegistry;
}
