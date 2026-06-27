// index.ts — @xxmm/plugin 统一导出
//
// 整合 @xxmm/types + @xxmm/ipc + @xxmm/events + @xxmm/i18n，
// 提供插件系统的顶层 API。

// 类型（插件作者需要）
export type {
  PluginContext,
  PluginConfigStore,
  PluginUIRegistry,
  PluginLogger,
  LoadedPlugin,
  PluginHost,
  PluginServices,
} from "./types";
export type { Plugin, PluginManifest, PluginConfigSchema } from "@xxmm/types";

// 构造工厂
export { createPluginContext } from "./context";
export { createConfigStore, extractDefaults } from "./config-store";
