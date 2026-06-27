// PluginLoader.ts — IPluginLoader 桥接适配器
//
// TODO: 桥接到 @xxmm/plugin 的真实实现。
// 当前是空壳适配器——所有方法仅打印警告，不执行实际操作。
// 插件系统在当前状态下不可用。
//
// 需实现：
//   Init() → PluginHost.scan() + PluginHost.load()
//   GetPluginData/SetPluginData → PluginContext.config
//   RegisterPluginConfig → PluginContext.config
//   SaveAllPluginConfig → 遍历所有 PluginContext.config.save()
//   togglePlugin → PluginHost.enable/disable
//
// 旧架构中 IManager 和 settingSection.vue 依赖 IPluginLoader 的全局 API。
// 新架构使用 @xxmm/plugin（PluginHost + PluginServices + createPluginContext）。
// 此适配器保留旧的 API 表面，内部桥接到新系统。

import type { PluginManifest } from "@xxmm/types";

// ---- 旧 API 表面 ----

interface OldPluginData {
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

class PluginLoaderBridge {
  /** 已注册的插件清单 */
  plugins: Record<string, PluginManifest & { t_displayName?: Record<string, string>; enabled?: boolean }> = {};

  /** 插件配置数据 */
  pluginConfig: Record<string, Record<string, unknown>> = {};

  /** 初始化。旧版接收 IManager 实例用于获取路径和配置。 */
  async Init(_imanager: unknown): Promise<void> {
    // TODO: 迁移到 @xxmm/plugin 的 PluginHost.scan() + PluginHost.load()
    console.warn("[PluginLoader] Init() 暂未桥接到 @xxmm/plugin，插件系统不可用");
  }

  /** 获取插件数据 */
  GetPluginData(_name: string): OldPluginData | undefined {
    // TODO: 迁移到 PluginContext.config
    return undefined;
  }

  /** 设置插件数据 */
  SetPluginData(_name: string, _data: unknown): void {
    // TODO: 迁移到 PluginContext.config.set()
  }

  /** 注册插件配置 */
  RegisterPluginConfig(_name: string, _config: unknown): void {
    // TODO: 迁移到 PluginContext.config
  }

  /** 同步保存所有插件配置 */
  SaveAllPluginConfigSync(): void {
    // TODO: 迁移到各 PluginContext.config.save()
  }

  /** 异步保存所有插件配置 */
  async SaveAllPluginConfig(): Promise<void> {
    // TODO: 迁移到各 PluginContext.config.save()
  }

  /** 切换插件启用状态 */
  togglePlugin(_name: string): void {
    // TODO: 迁移到 @xxmm/plugin 的 enable/disable 机制
  }
}

/** 全局单例（兼容旧 API） */
export const IPluginLoader = new PluginLoaderBridge();
