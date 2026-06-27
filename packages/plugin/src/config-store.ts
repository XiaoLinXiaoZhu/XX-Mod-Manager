// config-store.ts — PluginConfigStore 实现
//
// set() 自动 debounce 持久化，插件无需手动 save()。
// 这消除了旧版本中因保存 bug 导致的"恐慌保存"模式。

import type { PluginConfigSchema } from "@xxmm/types";
import type { PluginConfigStore } from "./types";

/** 从 configSchema 提取默认值 */
export function extractDefaults(schema: PluginConfigSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema)) {
    if ("default" in field && field.default !== undefined) {
      defaults[key] = field.default;
    }
  }
  return defaults;
}

/** 创建 PluginConfigStore —— set() 自动持久化 */
export function createConfigStore(
  pluginId: string,
  schema: PluginConfigSchema,
  saved: Record<string, unknown>,
  saveToDisk: (data: Record<string, unknown>) => Promise<void>,
  /** 插件调用 refreshSchema() 时触发。通常实现为 emit(pluginSchemaChanged, pluginId) */
  onRefreshSchema?: () => void,
): PluginConfigStore {
  // 合并：defaults ← saved（saved 覆盖 defaults）
  const defaults = extractDefaults(schema);
  const data: Record<string, unknown> = { ...defaults, ...saved };

  const listeners = new Map<string, Set<(value: unknown) => void>>();

  // debounce 持久化：300ms 内的多次 set 只触发一次写入
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleSave = () => {
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      saveToDisk({ ...data });
    }, 300);
  };

  return {
    get<T = unknown>(key: string): T {
      return data[key] as T;
    },

    set<T = unknown>(key: string, value: T): void {
      data[key] = value;
      // 通知监听者
      const fns = listeners.get(key);
      if (fns) {
        for (const fn of fns) fn(value);
      }
      // 自动持久化
      scheduleSave();
    },

    async save(): Promise<void> {
      // 立刻写入（跳过 debounce），用于退出前等场景
      if (saveTimer !== undefined) {
        clearTimeout(saveTimer);
        saveTimer = undefined;
      }
      await saveToDisk({ ...data });
    },

    onChange(key: string, fn: (value: unknown) => void): () => void {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(fn);
      return () => set.delete(fn);
    },

    refreshSchema(): void {
      onRefreshSchema?.();
    },
  };
}
