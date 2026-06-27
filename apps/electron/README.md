# @xxmm-apps/electron — Electron 主进程

XX-Mod-Manager 的 Electron 主进程，负责窗口管理、IPC handler 注册、原生模块桥接。

## 文件结构

```
src/
  main.js              — 入口：窗口创建、IPC handler 注册、生命周期管理
  fileSystem.js        — 文件系统操作（mod 读写、配置持久化）
  fsProxy.js           — 旧 fs 代理（逐步废弃，由 @xxmm/ipc 替代）
  IManager.js          — 旧 god object（逐步废弃，由 @xxmm/plugin 替代）
  hmcHandler.js        — HMC 原生模块 IPC handler（新增）
  fsWatchHandler.js    — 文件系统监听 IPC handler（新增）
  lib/
    index.js           — 库入口
    libarchive.js/wasm — 压缩包处理
```

## 架构决策

### 1. HMC：低层 API 暴露

`hmcHandler.js` 暴露 5 个低层 IPC channel（`getProcessList`、`getProcessWindow`、`getForegroundWindow`、`sendKey`、`setFocus`），而非封装高层 `refreshGame()`。

**理由**：不同游戏的刷新序列可能不同，低层 API 给插件最大灵活性。IPC 层保持薄，业务逻辑在插件侧。

**平台**：仅 Windows。非 Windows 平台 handler 返回空值/无操作。

**风险**：`hmc-win32` 是 C++ 原生 Node.js addon，Bun 运行时不兼容。如果未来迁移到 Electrobun，需要评估替代方案。

### 2. fs.watch：Node 内置 vs chokidar

选择 Node.js 内置 `fs.watch` 而非 chokidar。

**理由**：零外部依赖；对于 INI 文件变更监听场景，内置 API 足够；IPC 接口（`watch`/`unwatch`/`fileChanged`）与底层实现解耦，未来替换 chokidar 不影响上层。

**风险**：Linux 上 `recursive` 选项可能不可靠。当前应用主要面向 Windows。

### 3. 渲染进程权限收紧计划

当前：`nodeIntegration: true` + `contextIsolation: false`（插件可直接 `require('fs')`）。

目标：收紧权限，倒逼所有系统访问走 IPC。这是向 Electrobun 架构对齐的关键一步。

**时机**：等待插件系统 IPC 迁移（`@xxmm/ipc` + `@xxmm/plugin`）完成后执行。

## ESM + TypeScript 迁移计划

### 当前状态

`package.json` 中 `"type": "commonjs"`，所有文件使用 `require()` / `module.exports`。

### 目标

- `"type": "module"`（ESM）
- 源码 `.ts`（TypeScript）
- `bun build` 编译为 `.mjs`（Electron 执行）

### 构建模型

```
TypeScript 源码 → bun build → ESM JS (.mjs) → Electron 执行
```

`bun build` 将 `main.ts` 及其导入的所有依赖打包为单个 `.mjs`。外部依赖（`electron`、`hmc-win32`）标记为 `--external`。

### 验证结果

```
bun build main.ts --target=node --format=esm --external=electron
electron dist/main.mjs
→ ESM+TS OK! electron: 42.5.0
```

构建速度 ~10ms，产物 ~350 bytes（不含依赖）。

### 迁移步骤

1. 新增文件直接写 `.ts`（`hmcHandler.ts`、`fsWatchHandler.ts`）
2. 创建 `main.ts` 作为新入口，验证完整启动
3. 逐步转换 `fileSystem.ts`、`fsProxy.ts`
4. `IManager.js` 等待插件系统迁移完成后废弃

### 关键注意事项

- `hmc-win32` 是 CJS 原生模块，ESM 中需用 `createRequire` 桥接
- `__dirname` → `import.meta.url` + `fileURLToPath`
- `electron-builder` 的 `"main"` 指向构建产物 `dist/main.mjs`
- 开发时 `bun build --watch` 实现热重载
