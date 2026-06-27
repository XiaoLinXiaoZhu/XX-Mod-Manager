// plugin.ts — 插件协议类型
//
// 仅包含纯数据接口（无 @xxmm/ipc / @xxmm/events / @xxmm/i18n 依赖）。
// PluginContext 等依赖真实类型的接口在 @xxmm/plugin 中定义。

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
  /** 点击回调（接收 PluginContext，类型在 @xxmm/plugin 中定义） */
  onClick: (ctx: unknown) => void;
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
  setup(ctx: unknown): void | Promise<void>;
  teardown?(): void;
}

// ---- PluginConfig（运行时持久化格式，保留兼容） ----

export const PluginConfig = z.record(z.string(), z.unknown());
export type PluginConfig = z.infer<typeof PluginConfig>;
export const parsePluginConfig = (input: unknown): PluginConfig =>
  PluginConfig.parse(input);

// ---- DisabledPlugins ----

export const DisabledPlugins = z.array(z.string());
export type DisabledPlugins = z.infer<typeof DisabledPlugins>;
