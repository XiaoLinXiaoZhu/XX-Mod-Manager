// context.ts — PluginContext 构造工厂
//
// 为每个已加载插件构造其运行时 PluginContext。
//
// WIP: refreshSchema() → emit(pluginSchemaChanged) 的事件发送方已就绪，
// 但 UI 层（settingSection.vue）的监听尚未实现。
// 当前 refreshSchema() 调用会发出事件但无人接收，不产生可见效果。

import type { I18nScope, I18nFn } from "@xxmm/i18n";
import { createI18nFn } from "@xxmm/i18n";
import { AppEvents } from "@xxmm/events";
import type { LoadedPlugin, PluginContext, PluginServices, PluginLogger } from "./types";
import { createConfigStore } from "./config-store";

/** 创建 PluginLogger：为指定插件加前缀 */
function createLogger(pluginId: string): PluginLogger {
  const prefix = `[${pluginId}]`;

  return {
    debug(...args: unknown[]) {
      console.debug(prefix, ...args);
    },
    info(...args: unknown[]) {
      console.info(prefix, ...args);
    },
    warn(...args: unknown[]) {
      console.warn(prefix, ...args);
    },
    error(...args: unknown[]) {
      console.error(prefix, ...args);
    },
  };
}

/** 为已加载插件构造完整的 PluginContext */
export async function createPluginContext(
  plugin: LoadedPlugin,
  services: PluginServices,
  i18nScope: I18nScope,
): Promise<PluginContext> {
  const i18n: I18nFn = createI18nFn(i18nScope, services.langState);

  // 加载已保存配置
  const saved = await services.loadConfig(plugin.manifest.id);

  const config = createConfigStore(
    plugin.manifest.id,
    plugin.module.configSchema ?? {},
    saved,
    async (data) => {
      await services.saveConfig(plugin.manifest.id, data);
    },
    // WIP: refreshSchema → emit 事件，UI 层（settingSection.vue）尚未监听此事件。
    // 当 UI 层实现监听后，调用 refreshSchema() 即可触发重新渲染。
    () => {
      services.events.emit(AppEvents.pluginSchemaChanged, plugin.manifest.id);
    },
  );

  const log = createLogger(plugin.manifest.id);

  const snack = (message: string, type: "info" | "error" | "warning" = "info"): void => {
    // IPC snack channel 使用 "warn" 而非 "warning"
    const ipcType = type === "warning" ? "warn" : type;
    services.ipc.app.snack(message, ipcType);
  };

  return {
    i18n,
    ipc: services.ipc,
    events: services.events,
    config,
    ui: services.ui,
    log,
    snack,
  };
}
