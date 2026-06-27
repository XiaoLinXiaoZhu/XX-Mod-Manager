// colorScheme.ts — createColorScheme() 工厂函数
//
// 主题驱动的渐变色动画。使用 @tweenjs/tween.js 在两个颜色之间往复插值。
//
// 纯函数式设计：
// - 无全局状态，无 EventSystem 依赖
// - 主题切换、暂停/恢复通过返回对象的方法控制
// - 生命周期通过 AbortSignal 管理

import { Tween, Easing, Group } from "@tweenjs/tween.js";
import { Color } from "./color";
import type { ColorPair } from "./color";

export interface ColorSchemeOptions {
  /** 两套主题的颜色对 */
  themes: {
    dark: ColorPair;
    light: ColorPair;
  };
  /** 每次颜色更新时回调，参数为 6 位 hex 字符串 */
  onChange: (hexString: string) => void;
  /** 动画单程时长（ms），默认 2000 */
  duration?: number;
  /** 外部 AbortSignal，触发后停止动画并清理资源 */
  signal?: AbortSignal;
}

export interface ColorScheme {
  /** 切换主题 */
  setTheme(theme: "dark" | "light"): void;
  /** 获取当前颜色的 hex 字符串 */
  getColor(): string;
  /** 暂停动画 */
  pause(): void;
  /** 恢复动画 */
  resume(): void;
  /** 销毁：停止动画，移除所有 tween */
  destroy(): void;
}

/** 默认配色 */
const defaultThemes = {
  dark: {
    startColor: new Color(0x9fb900),
    endColor: new Color(0xf2d900),
  },
  light: {
    startColor: new Color(0x53727e),
    endColor: new Color(0x0e3f3c),
  },
};

/**
 * 创建颜色方案实例。
 *
 * 内部使用 @tweenjs/tween.js 的 Tween + Group，
 * 在两个颜色之间 yoyo 循环插值。
 */
export function createColorScheme(options: ColorSchemeOptions): ColorScheme {
  const themes = options.themes ?? defaultThemes;
  const onChange = options.onChange;
  const duration = options.duration ?? 2000;

  let currentTheme: "dark" | "light" = "dark";
  let currentColor = themes.dark.startColor.clone();
  let paused = false;
  let destroyed = false;

  const group = new Group();
  let tween: Tween<{ r: number; g: number; b: number }> | null = null;

  /** 内部：根据当前主题创建/重启 tween */
  function startTween(): void {
    if (destroyed) return;

    // 清理旧 tween
    group.removeAll();

    const pair = themes[currentTheme];
    tween = new Tween({
      r: pair.startColor.r,
      g: pair.startColor.g,
      b: pair.startColor.b,
    });

    tween
      .to({ r: pair.endColor.r, g: pair.endColor.g, b: pair.endColor.b }, duration)
      .easing(Easing.Quadratic.InOut)
      .onUpdate((obj) => {
        const r = Math.floor(obj.r) & 0xff;
        const g = Math.floor(obj.g) & 0xff;
        const b = Math.floor(obj.b) & 0xff;
        currentColor = new Color((r << 16) | (g << 8) | b);
        onChange(currentColor.hexString);
      })
      .yoyo(true)
      .repeat(Infinity)
      .repeatDelay(500)
      .start();

    group.add(tween);
  }

  /** 每帧更新 tween group */
  function tick(): void {
    if (destroyed || paused) return;
    group.update();
    rafId = requestAnimationFrame(tick);
  }

  let rafId: number;

  // 启动
  startTween();
  rafId = requestAnimationFrame(tick);

  // AbortSignal 处理
  if (options.signal) {
    options.signal.addEventListener("abort", () => destroy(), { once: true });
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(rafId);
    group.removeAll();
    tween = null;
  }

  return {
    setTheme(theme: "dark" | "light") {
      if (destroyed || currentTheme === theme) return;
      currentTheme = theme;
      startTween();
    },

    getColor(): string {
      return currentColor.hexString;
    },

    pause() {
      paused = true;
    },

    resume() {
      if (destroyed || !paused) return;
      paused = false;
      rafId = requestAnimationFrame(tick);
    },

    destroy,
  };
}
