// plugin.ts — 插件相关类型

import { z } from "zod";

// ---- PluginName：插件名称 ----

export const PluginName = z.string().min(1).brand<"PluginName">();
export type PluginName = z.infer<typeof PluginName>;
export const parsePluginName = (s: string): PluginName => PluginName.parse(s);
export const asPluginName = (s: string): PluginName => s as PluginName;

// ---- PluginConfig：插件配置 ----

export const PluginConfig = z.record(z.string(), z.unknown());
export type PluginConfig = z.infer<typeof PluginConfig>;

/** 边界处解析插件配置 */
export const parsePluginConfig = (input: unknown): PluginConfig =>
  PluginConfig.parse(input);

// ---- DisabledPlugins：禁用插件列表 ----

export const DisabledPlugins = z.array(z.string());
export type DisabledPlugins = z.infer<typeof DisabledPlugins>;
