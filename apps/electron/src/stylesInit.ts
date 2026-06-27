// stylesInit.ts — @xxmm/styles 初始化
//
// 创建颜色方案和三个 CSS class 管理器，订阅全局事件。
// 由各入口页面（main / firstLoad / switchConfig）导入。
//
// 替代旧架构中 classManager.js + colorManager.js 的全局副作用。
// 旧文件在 apps/desktop/vault/src/js/ 下，已于 2025-07 删除。

import { Color, createClassManager, createColorScheme } from "@xxmm/styles";
import { bus } from "./eventBus";
import { AppEvents } from "@xxmm/events";

/** 当前颜色缓存（闭包共享） */
let currentColor = "";

/** 颜色方案 */
export const scheme = createColorScheme({
  themes: {
    dark: {
      startColor: new Color(0x9fb900),
      endColor: new Color(0xf2d900),
    },
    light: {
      startColor: new Color(0x53727e),
      endColor: new Color(0x0e3f3c),
    },
  },
  onChange: (hex) => {
    currentColor = hex;
  },
});

// ---- 事件绑定 ----

bus.on(AppEvents.themeChange, (theme: string) => {
  if (theme === "dark" || theme === "light") {
    scheme.setTheme(theme);
  }
});

bus.on(AppEvents.windowFocus, () => scheme.resume());
bus.on(AppEvents.windowSleep, () => scheme.pause());

// ---- CSS class 管理器 ----

/** 背景渐变色：OO-color-gradient */
export const bgGradient = createClassManager({
  className: "OO-color-gradient",
  onUpdate(items) {
    for (const el of items) {
      el.style.backgroundColor = `#${currentColor}`;
    }
  },
  onDestroy(el) {
    el.style.backgroundColor = "";
  },
});

/** 文字渐变色：OO-color-gradient-word */
export const wordGradient = createClassManager({
  className: "OO-color-gradient-word",
  onUpdate(items) {
    for (const el of items) {
      el.style.color = `#${currentColor}`;
    }
  },
  onDestroy(el) {
    el.style.color = "";
  },
});

/** 边框渐变色：OO-color-gradient-border */
export const borderGradient = createClassManager({
  className: "OO-color-gradient-border",
  onUpdate(items) {
    for (const el of items) {
      el.style.borderColor = `#${currentColor}`;
    }
  },
  onDestroy(el) {
    el.style.borderColor = "";
  },
});
