# @xxmm/plugin — 插件宿主集成层

整合 `@xxmm/types` + `@xxmm/ipc` + `@xxmm/events` + `@xxmm/i18n`，
提供插件系统的运行时 API。

## 核心类型

| 类型 | 说明 |
|------|------|
| `PluginContext` | 插件运行时上下文——IPC、事件、配置、UI、日志 |
| `PluginConfigStore` | 声明式配置存储，set() 自动 debounce 持久化 |
| `PluginUIRegistry` | UI 薄封装——CSS 注入和对话框操作 |
| `PluginHost` | 主进程侧——扫描、加载、卸载插件 |
| `PluginServices` | 构造 PluginContext 所需的全部依赖 |

## 架构决策

### 1. PluginUIRegistry 极简设计

`ctx.ui` 只有 4 个方法：`addCss`、`removeCss`、`showDialog`、`dismissDialog`。

**不提供**：`addToolbarButton`、`addDialogAction`、`addEventListener` 等高层封装。

**理由**：
- Electron 的 `nodeIntegration: true` + `contextIsolation: false` 下，插件已有 `document` 访问权
- 旧架构的问题不是"插件操作 DOM"，而是 `require('fs')`、`require('electron')` 等系统访问没有类型安全边界
- 每多一层 UI 封装就多一个维护点——插件作者自己 `document.createElement` + `querySelector` 更灵活

**否决方案**：
- `addToolbarButton / removeToolbarButton` — 插件直接用 `document` 在工具栏注入按钮
- `addDialogAction` — 插件用 `document.querySelector` + `insertBefore` 在对话框中注入按钮
- `addEventListener` 封装 — 插件用 `document.querySelectorAll` + `addEventListener`

### 2. 动态 select options：refreshSchema()

`PluginConfigStore.refreshSchema()` 通知 UI 重读 configSchema。

**用法**：插件持有 schema 对象引用 → 监听数据变化 → 修改 schema → 调用 `refreshSchema()`。

**否决方案**：
- 函数式 `options: (ctx) => [...]` — 每次渲染都调用，性能不可控
- `patchSchema(patch)` 通用方法 — 过度抽象，refreshSchema 更简单直接

**当前状态**：事件发送方已实现，UI 层（`settingSection.vue`）的监听尚未实现。

### 3. Button onClick 机制

`PluginButtonField.onClick(ctx: unknown)` 由 UI 层在按钮点击时调用，传入真实 `PluginContext`。

**当前状态**：类型已定义，`settingBar.vue` 尚未适配（仍使用旧的 `onChange` API）。

### 4. PluginServices.ui 外部注入

`createPluginContext` 使用 `services.ui`（而非内部创建空壳），UI 实现由渲染进程提供。
这使得 `PluginUIRegistry` 的实现可以访问 DOM 而不需要 `@xxmm/plugin` 依赖浏览器 API。

## ESM + TypeScript 迁移

当前包使用 TypeScript + ESM（`import`/`export`）。Electron 主进程也计划迁移到 ESM + TS。
详见 `apps/electron/README.md`。
