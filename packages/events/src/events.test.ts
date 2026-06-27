// events.test.ts — @xxmm/events 功能测试

import { describe, test, expect } from "bun:test";
import { e, createEventBus } from "./index";
import type { EventBus } from "./index";

// ---- 辅助：定义测试用事件 ----

const TestEvents = {
  simple: e("test:simple"),
  withPayload: e<{ name: string; count: number }>("test:withPayload"),
  nums: e<number>("test:nums"),
} as const;

function setup(): EventBus {
  return createEventBus();
}

// ---- 测试 ----

describe("EventChannel (e)", () => {
  test("e() 创建 channel 含 name 和 _mode", () => {
    const ch = e("my-event");
    expect(ch.name).toBe("my-event");
    expect(ch._mode).toBe("event");
  });

  test("相同 name 的 channel 是不同的对象但 on/emit 按 name 匹配", () => {
    const a = e("dup");
    const b = e("dup");
    expect(a).not.toBe(b);
    expect(a.name).toBe(b.name);

    const bus = createEventBus();
    let called = 0;
    bus.on(a, () => { called++; });
    bus.emit(b, undefined);
    // emit 按 name 匹配，所以 b 也能触达 a 的 listener
    expect(called).toBe(1);
  });
});

describe("EventBus", () => {
  test("on + emit：handler 被调用且收到正确的 payload", () => {
    const bus = setup();
    const received: { name: string; count: number }[] = [];

    bus.on(TestEvents.withPayload, (p) => received.push(p));
    bus.emit(TestEvents.withPayload, { name: "test", count: 42 });

    expect(received).toEqual([{ name: "test", count: 42 }]);
  });

  test("多个 handler 订阅同一事件都被调用", () => {
    const bus = setup();
    let a = 0;
    let b = 0;

    bus.on(TestEvents.simple, () => { a++; });
    bus.on(TestEvents.simple, () => { b++; });
    bus.emit(TestEvents.simple, undefined);

    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  test("unsubscribe：on() 返回的函数取消订阅后不再被调用", () => {
    const bus = setup();
    let count = 0;

    const unsub = bus.on(TestEvents.nums, (_n) => { count++; });

    bus.emit(TestEvents.nums, 1);
    expect(count).toBe(1);

    unsub();
    bus.emit(TestEvents.nums, 2);
    expect(count).toBe(1);
  });

  test("off：手动移除 handler 后不再被调用", () => {
    const bus = setup();
    let count = 0;
    const handler = (_n: number) => { count++; };

    bus.on(TestEvents.nums, handler);
    bus.emit(TestEvents.nums, 5);
    expect(count).toBe(1);

    bus.off(TestEvents.nums, handler);
    bus.emit(TestEvents.nums, 10);
    expect(count).toBe(1);
  });

  test("emit 未订阅的事件不会抛错", () => {
    const bus = setup();
    expect(() => bus.emit(TestEvents.simple, undefined)).not.toThrow();
  });

  test("同一 handler 重复 on 自动去重（Set 语义）", () => {
    const bus = setup();
    let count = 0;
    const handler = () => { count++; };

    bus.on(TestEvents.simple, handler);
    bus.on(TestEvents.simple, handler); // 同一引用 —— Set 去重
    bus.emit(TestEvents.simple, undefined);

    expect(count).toBe(1);
  });

  test("隔离性：两个 EventBus 实例互不影响", () => {
    const bus1 = createEventBus();
    const bus2 = createEventBus();
    let c1 = 0;
    let c2 = 0;

    bus1.on(TestEvents.simple, () => { c1++; });
    bus2.on(TestEvents.simple, () => { c2++; });

    bus1.emit(TestEvents.simple, undefined);
    expect(c1).toBe(1);
    expect(c2).toBe(0);
  });
});
