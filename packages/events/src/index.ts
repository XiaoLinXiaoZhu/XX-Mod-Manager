// @xxmm/events — 类型安全进程内事件总线
//
// 与 @xxmm/ipc 使用相同的 channel 定义模式（e() + as const 对象树）。
//
// 快速开始：
//   import { e, createEventBus } from "@xxmm/events";
//
//   const Events = {
//     lifecycle: {
//       wakeUp: e("lifecycle:wakeUp"),
//     },
//     mod: {
//       changed: e<ModData>("mod:changed"),
//     },
//   } as const;
//
//   const bus = createEventBus();
//   bus.on(Events.mod.changed, (mod) => { console.log(mod.name); });
//   bus.emit(Events.mod.changed, someMod);

export { e } from "./channel";
export type { EventChannel } from "./channel";
export { createEventBus } from "./bus";
export type { EventBus } from "./bus";
