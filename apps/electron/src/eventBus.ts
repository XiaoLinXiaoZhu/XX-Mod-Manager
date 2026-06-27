// eventBus.ts — 应用级共享 EventBus 实例
//
// 所有渲染进程模块共享此 EventBus。
// IManager、classManager、colorManager、Vue 组件均通过此实例通信。
//
// TODO: 迁移完成后，此模块应被依赖注入替代。
// 当前作为过渡方案：各模块 import { bus } 获取共享实例。
// 最终目标：main.js 创建 bus，通过 provide/inject 传递给 Vue 组件，
// 非 Vue 代码通过函数参数接收。

import { createEventBus } from "@xxmm/events";

/** 应用级共享 EventBus */
export const bus = createEventBus();
