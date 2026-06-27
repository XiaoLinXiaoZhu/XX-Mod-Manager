// bus.ts — 类型安全进程内 EventBus
//
// 用法：
//   const bus = createEventBus();
//   const unsub = bus.on(Events.mod.changed, (mod) => { ... });  // mod 类型自动推导
//   bus.emit(Events.mod.changed, someMod);                       // payload 类型检查
//   unsub();                                                     // 取消订阅

import type { EventChannel } from "./channel";

export interface EventBus {
  /**
   * 订阅事件，返回取消订阅函数。
   * handler 的 payload 参数类型由 EventChannel<P> 推导。
   */
  on<P>(channel: EventChannel<P>, handler: (payload: P) => void): () => void;

  /**
   * 发布事件。payload 类型必须匹配 EventChannel<P>。
   */
  emit<P>(channel: EventChannel<P>, payload: P): void;

  /**
   * 移除指定 handler。通常用 on() 返回的 unsubscribe 函数即可。
   */
  off<P>(channel: EventChannel<P>, handler: (payload: P) => void): void;
}

/** 创建一个独立的 EventBus 实例 */
export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const ensureSet = (name: string): Set<(...args: unknown[]) => void> => {
    const existing = listeners.get(name);
    if (existing) return existing;
    const set = new Set<(...args: unknown[]) => void>();
    listeners.set(name, set);
    return set;
  };

  return {
    on<P>(channel: EventChannel<P>, handler: (payload: P) => void) {
      const set = ensureSet(channel.name);
      set.add(handler as (...args: unknown[]) => void);
      return () => set.delete(handler as (...args: unknown[]) => void);
    },

    emit<P>(channel: EventChannel<P>, payload: P) {
      const set = listeners.get(channel.name);
      if (!set) return;
      for (const fn of set) {
        (fn as (p: P) => void)(payload);
      }
    },

    off<P>(channel: EventChannel<P>, handler: (payload: P) => void) {
      listeners.get(channel.name)?.delete(handler as (...args: unknown[]) => void);
    },
  };
}
