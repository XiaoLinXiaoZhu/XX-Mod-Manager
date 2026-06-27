// @xxmm/styles — 浏览器端 DOM 样式效果和 CSS class 管理工具包
//
// 纯浏览器包，无 Electron/Node.js 依赖。
// 无全局状态 — 所有功能通过工厂函数创建独立实例。

export { Color } from "./color";
export type { ColorPair } from "./color";

export { createClassManager } from "./classManager";
export type { ClassManager, ClassManagerOptions } from "./classManager";

export { createColorScheme } from "./colorScheme";
export type { ColorScheme, ColorSchemeOptions } from "./colorScheme";
