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

## 安全迁移：contextIsolation

Electron 渲染进程已收紧——`nodeIntegration: false` + `contextIsolation: true`。
这意味着渲染进程**不能再**：

```javascript
// 这些在渲染进程中不再可用：
require("fs")           // → 使用 ctx.ipc.fs.*
require("electron")     // → 使用 ctx.ipc.*
require("node:path")    // → 使用 ctx.ipc.fs.* 或纯 JS path 工具
__dirname / __filename  // → 不可用
```

### 对插件的影响

插件的 `setup(ctx)` 中，`ctx` 已经提供了所需的一切：

| 旧方式（渲染进程直接访问） | 新方式（通过 ctx） |
|---|---|
| `require("fs").readFileSync(p)` | `await ctx.ipc.fs.readFile(p)` |
| `require("electron").ipcRenderer` | `ctx.ipc.*`（类型安全） |
| `iManager.snack(msg)` | `ctx.snack(msg)` |
| `iManager.on(event, fn)` | `ctx.events.on(event, fn)` |
| `iManager.getPluginData(...)` | `ctx.config.get(key)` |
| `iManager.setPluginData(...)` | `ctx.config.set(key, value)` |
| `iManager.addCssWithHash(css)` | `ctx.ui.addCss(css)` |
| `iManager.showDialog(id)` | `ctx.ui.showDialog(id)` |

### DOM 访问不变

`document`、`window` 在 `contextIsolation: true` 下仍然可用——它们是浏览器标准 API。
所以插件的 DOM 操作（`document.createElement`、`querySelector`、`addEventListener`）不受影响。

### 需要修改的插件文件

`data/plugins/*.js` 中的旧插件使用了 `require("fs")`、`require("electron")`、`require("node:path")`。
这些需要迁移为通过 `ctx` 的等效调用。详见各插件中的 `TODO` 注释。

## 架构决策

### 1. PluginUIRegistry 极简设计

`ctx.ui` 只有 4 个方法：`addCss`、`removeCss`、`showDialog`、`dismissDialog`。

**不提供**：`addToolbarButton`、`addDialogAction`、`addEventListener` 等高层封装。

**理由**：
- 插件已有 `document` 访问权（`contextIsolation` 不影响 DOM API）
- 旧架构的问题不是"插件操作 DOM"，而是系统访问没有类型安全边界
- 每多一层 UI 封装就多一个维护点

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
