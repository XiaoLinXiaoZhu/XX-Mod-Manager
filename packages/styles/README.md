# @xxmm/styles

浏览器端 DOM 样式效果和 CSS class 生命周期管理工具包。

## 用途

替代旧架构中两个全局副作用文件：

- `classManager.js` — ClassManagerService 全局单例 + ClassManager 基类
- `colorManager.js` — 渐变色动画 + 三个 CSS class 着色器

新设计：工厂函数，无全局状态，无 `@xxmm/*` 依赖。

## API

```typescript
// DOM 元素生命周期管理
const mgr = createClassManager({
  className: "OO-color-gradient",
  onInit(el) { /* 新元素出现 */ },
  onDestroy(el) { /* 元素移除 */ },
  onUpdate(items) { /* 每帧回调 */ },
  signal: abortController.signal,
});
mgr.refresh();  // 手动重新扫描 DOM
mgr.destroy();   // 停止 RAF 循环

// 主题渐变色动画
const scheme = createColorScheme({
  themes: { dark: { startColor, endColor }, light: { startColor, endColor } },
  onChange(hex) { /* 颜色更新 */ },
});
scheme.setTheme("dark");
scheme.pause();
scheme.resume();
```

## 决策点

- **每实例独立 RAF 循环**：当前 3 个 color manager 各有一个 RAF 循环。对于少量实例可接受；大量使用时考虑共享调度器。
- **`MutationObserver` 未启用**：当前沿用旧代码的按需 `refresh()` 轮询模式。迁移成本低，可在需要时开启。
- **`@tweenjs/tween.js` 依赖保留**：体积 ~15KB，无更轻量的替代方案。
