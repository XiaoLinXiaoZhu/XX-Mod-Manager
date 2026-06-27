// channel.ts — 进程内事件 channel 定义
//
// 与 @xxmm/ipc 的 h()/s()/p() 模式一致：
//   EventChannel<P> — 携带 payload 类型 P 的品牌类型
//   e()            — 工厂函数

/** 进程内 pub-sub 事件 channel */
export interface EventChannel<P = void> {
  readonly name: string;
  readonly _mode: "event";
  /** payload 类型（仅类型标注，运行时不存在） */
  readonly _payload?: P;
}

/** 定义事件 channel */
export function e<P = void>(name: string): EventChannel<P> {
  return { name, _mode: "event" } as EventChannel<P>;
}
