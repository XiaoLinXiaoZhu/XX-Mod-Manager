// plugin.ts — 插件协议类型（新版）
//
// 设计原则：
//   - 所有文本均为 defaultLanguage 的纯字符串，由 i18n scope 处理翻译
//   - 无 TranslatedText class、无 require hack
//   - Plugin 接口只含行为（configSchema + setup），元数据在 manifest.json
//
// NOTE: PluginContext 中的 ipc / events / i18n 使用最小化接口定义，
// 避免 @xxmm/types → @xxmm/ipc 循环依赖。
// 宿主构造 PluginContext 时将实际类型（IPCClient, EventBus, I18nFn）赋值给这些字段。

import { z } from "zod";

// ---- PluginName（保留品牌类型） ----

export const PluginName = z.string().min(1).brand<"PluginName">();
export type PluginName = z.infer<typeof PluginName>;
export const parsePluginName = (s: string): PluginName => PluginName.parse(s);
export const asPluginName = (s: string): PluginName => s as PluginName;

// ---- PluginManifest：manifest.json 的结构 ----

export interface PluginManifest {
  id: string;
  /** defaultLanguage 的纯字符串 */
  displayName: string;
  /** defaultLanguage 的纯字符串 */
  description?: string;
  version: string;
  author?: string;
  i18n: {
    defaultLanguage: string;
  };
}

// ---- PluginConfigSchema：声明式配置（自动生成 UI） ----

export type PluginConfigField =
  | PluginBooleanField
  | PluginStringField
  | PluginNumberField
  | PluginPathField
  | PluginSelectField
  | PluginButtonField
  | PluginMarkdownField;

interface PluginFieldBase {
  /** defaultLanguage 的纯字符串 */
  name: string;
  /** defaultLanguage 的纯字符串 */
  description?: string;
}

export interface PluginBooleanField extends PluginFieldBase {
  type: "boolean";
  default: boolean;
}

export interface PluginStringField extends PluginFieldBase {
  type: "string";
  default: string;
}

export interface PluginNumberField extends PluginFieldBase {
  type: "number";
  default: number;
  min?: number;
  max?: number;
}

export interface PluginPathField extends PluginFieldBase {
  type: "path";
  default: string;
  /** 文件类型过滤，如 "exe" */
  fileType?: string;
}

export interface PluginSelectField extends PluginFieldBase {
  type: "select";
  default: string;
  options: PluginSelectOption[];
}

export interface PluginSelectOption {
  value: string;
  /** defaultLanguage 的纯字符串 */
  label: string;
}

export interface PluginButtonField extends PluginFieldBase {
  type: "button";
  /** 点击时调用，传入完整 PluginContext */
  onClick: (ctx: PluginContext) => void;
}

export interface PluginMarkdownField extends PluginFieldBase {
  type: "markdown";
  /** defaultLanguage 的纯字符串（markdown 内容） */
  content?: string;
}

export type PluginConfigSchema = Record<string, PluginConfigField>;

// ---- Plugin：main.ts 导出的对象 ----

export interface Plugin {
  configSchema?: PluginConfigSchema;
  setup(ctx: PluginContext): void | Promise<void>;
  teardown?(): void;
}

// ---- PluginContext 子接口（最小化定义，避免循环依赖） ----

/** scoped i18n：支持 i18n("key") 和 i18n`模板` */
export interface PluginI18n {
  (text: string): string;
  (strings: TemplateStringsArray, ...slots: (string | number | boolean | null | undefined)[]): string;
}

/** 插件视角的类型安全 IPC */
export interface PluginIPC {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, handler: (...args: unknown[]) => void): () => void;
}

/** 插件视角的类型安全事件总线 */
export interface PluginEvents {
  on(channel: { readonly name: string }, handler: (...args: unknown[]) => void): () => void;
  emit(channel: { readonly name: string }, ...args: unknown[]): void;
}

// ---- PluginContext：插件运行时环境 ----

export interface PluginContext {
  /** scoped i18n */
  i18n: PluginI18n;

  /** 类型安全 IPC 客户端 */
  ipc: PluginIPC;

  /** 文件系统代理（全异步，通过 IPC） */
  fs: PluginFS;

  /** 类型安全进程内事件 */
  events: PluginEvents;

  /** 插件配置读写 */
  config: PluginConfigStore;

  /** UI 注册 */
  ui: PluginUIRegistry;

  /** 结构化日志 */
  log: PluginLogger;

  /** 通知提示（message 已经过 i18n 翻译） */
  snack: (message: string, type?: "info" | "error" | "warning") => void;
}

// ---- PluginFS ----

export interface PluginFS {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  isDir(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  getFilePath(options: {
    fileName: string;
    fileType: string;
    defaultPath: string;
  }): Promise<string>;
  openDir(path: string): Promise<void>;
}

// ---- PluginConfigStore ----

export interface PluginConfigStore {
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): void;
  /** 持久化到磁盘 */
  save(): Promise<void>;
  /** 监听配置变更，返回 unsubscribe */
  onChange(key: string, fn: (value: unknown) => void): () => void;
}

// ---- PluginUIRegistry ----

export interface PluginUIRegistry {
  /** 在工具栏添加按钮 */
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

// ---- PluginConfig（运行时持久化格式，保留兼容） ----

export const PluginConfig = z.record(z.string(), z.unknown());
export type PluginConfig = z.infer<typeof PluginConfig>;
export const parsePluginConfig = (input: unknown): PluginConfig =>
  PluginConfig.parse(input);

// ---- DisabledPlugins ----

export const DisabledPlugins = z.array(z.string());
export type DisabledPlugins = z.infer<typeof DisabledPlugins>;
