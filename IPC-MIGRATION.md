# IPC 类型安全层迁移指南

## 概述

`@xxmm/ipc` 和 `@xxmm/types` 为 Electron 主进程和渲染进程之间的通信提供了端到端的类型安全。

**核心思想**：所有 IPC 接口在 `packages/ipc/src/channels.ts` 中集中定义。前后端各自引用同一份定义，编译器自动检查参数和返回值类型的正确性。

## 快速开始

### 渲染进程（前端 Vue）

```typescript
import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asModName, asModSourcePath } from "@xxmm/types";

const ipc = createClient(IPC);

// handle 模式：异步方法，返回 Promise
const content = await ipc.fs.readFile(asFilePath("/path/to/file.txt"));
const mods = await ipc.mod.list(asModSourcePath("/mods"));
await ipc.window.minimize();

// send 模式：同步方法，不返回值
ipc.app.snack("操作完成", "info");
ipc.app.mainWindowReady();

// push 模式：通过 .on() 监听主进程推送
const unsubscribe = ipc.on(IPC.lifecycle.wakeUp, (event) => {
  console.log("主进程已就绪");
});
// 组件卸载时取消监听
unsubscribe();
```

### 主进程（Electron）

```typescript
import { createIPCMain, createWindowIPC, IPC } from "@xxmm/ipc";
import { parseFilePath, parseModSourcePath } from "@xxmm/types";

const ipc = createIPCMain();

// 注册 handle handler（响应渲染进程 invoke 调用）
ipc.handle(IPC.fs.readFile, async (event, path) => {
  const safePath = parseFilePath(path);  // 边界校验 + 类型收窄
  return fs.readFileSync(safePath, "utf-8");
});

ipc.handle(IPC.mod.list, async (event, source) => {
  const safe = parseModSourcePath(source);
  return fs.readdirSync(safe);
});

// 注册 send handler（接收渲染进程单向通知）
ipc.on(IPC.app.snack, (event, message, type) => {
  console.log(`[${type}] ${message}`);
});

// 向窗口推送消息
const winIPC = createWindowIPC(mainWindow);
winIPC.send(IPC.lifecycle.wakeUp);
```

## 三种通信模式

| 模式 | 方向 | 渲染进程 | 主进程 | 典型场景 |
|------|------|---------|--------|---------|
| **handle** | 渲染→主→渲染 | `await ipc.fs.readFile(...)` | `ipc.handle(IPC.fs.readFile, ...)` | 请求文件内容 |
| **send** | 渲染→主 | `ipc.app.snack(...)` | `ipc.on(IPC.app.snack, ...)` | 通知/事件 |
| **push** | 主→渲染 | `ipc.on(IPC.lifecycle.wakeUp, ...)` | `winIPC.send(IPC.lifecycle.wakeUp)` | 主进程推送 |

## 命名空间一览

```
IPC
├── window    窗口控制（最小化、最大化、关闭、全屏、置顶）
├── fs        文件系统代理（读写文件、列目录、判断类型）
├── app       应用级（获取参数、路径、打开URL、snack通知）
├── config    配置管理（读写配置、自定义配置路径）
├── mod       Mod 管理（列表、详情、应用、图片、文件操作）
├── preset    预设管理（列表、加载、保存）
├── plugin    插件管理（配置、启用/禁用）
└── lifecycle 生命周期事件（wakeUp、windowBlur、windowFocus）
```

## 品牌类型（Branded Types）

`@xxmm/types` 提供了 14 个品牌类型，在编译时区分语义相同但含义不同的 `string`。

### 使用模式（Parse, Don't Validate）

```
构造端（渲染进程）          边界（主进程 handler）
─────────────────────      ─────────────────────
asFilePath(s)        →     parseFilePath(s)
编译时断言，零开销          运行时校验 + 类型收窄
```

### 类型清单

| 类型 | 含义 | 构造 | 解析 |
|------|------|------|------|
| `FilePath` | 文件路径 | `asFilePath(s)` | `parseFilePath(s)` |
| `DirPath` | 目录路径 | `asDirPath(s)` | `parseDirPath(s)` |
| `ModSourcePath` | Mod 源目录 | `asModSourcePath(s)` | `parseModSourcePath(s)` |
| `ModTargetPath` | Mod 目标目录 | `asModTargetPath(s)` | `parseModTargetPath(s)` |
| `ImagePath` | 图片路径 | `asImagePath(s)` | `parseImagePath(s)` |
| `ModName` | Mod 名称 | `asModName(s)` | `parseModName(s)` |
| `ModField` | Mod 字段名 | `asModField(s)` | `parseModField(s)` |
| `PresetName` | 预设名称 | `asPresetName(s)` | `parsePresetName(s)` |
| `PluginName` | 插件名称 | `asPluginName(s)` | `parsePluginName(s)` |
| `BoundsStr` | 窗口位置JSON | `asBoundsStr(s)` | `parseBoundsStr(s)` → `parseWindowBounds` |
| `CustomConfigFolder` | 自定义配置路径 | `asCustomConfigFolder(s)` | `parseCustomConfigFolder(s)` |

### 复合对象类型（Zod Schema）

| 类型 | 说明 |
|------|------|
| `GetArgsResult` | `{ devMode, firstpage, ... }` |
| `ModInfo` | 完整 Mod 元数据 |
| `SaveModInfo` | 保存 Mod 信息时的输入 |
| `GetFilesResult` | `{ state: number, ret: string[] }` |
| `AppConfig` | 应用配置（`Record<string, unknown>`） |
| `PluginConfig` | 插件配置 |
| `WindowBounds` | `{ x, y, width, height }` |

## 如何新增 IPC 接口

### 1. 在 `packages/types/src/` 定义类型（如有需要）

```typescript
// packages/types/src/mod.ts
export const ModId = z.string().min(1).brand<"ModId">();
export type ModId = z.infer<typeof ModId>;
export const parseModId = (s: string): ModId => ModId.parse(s);
export const asModId = (s: string): ModId => s as ModId;
```

### 2. 在 `packages/ipc/src/channels.ts` 添加 channel

```typescript
// 选择合适的命名空间或新建
export const IPC = {
  // ... 其他命名空间 ...
  mod: {
    // ... 已有 channel ...
    
    // 新增：按 ID 获取 Mod
    getById: h<[id: ModId], ModInfo | null>("mod-get-by-id"),
  },
} as const;
```

### 3. 主进程实现 handler

```typescript
import { parseModId } from "@xxmm/types";

ipc.handle(IPC.mod.getById, async (event, id) => {
  const safeId = parseModId(id);
  const mod = findModById(safeId);
  return mod ?? null;
});
```

### 4. 渲染进程调用

```typescript
import { asModId } from "@xxmm/types";

const mod = await ipc.mod.getById(asModId("abc123"));
```

**修改任何 channel 的类型签名后，TypeScript 会在前后两端同时报错，确保不会出现运行时类型不匹配。**

## 从旧代码迁移

### 旧代码（无类型，字符串拼接）

```javascript
// 主进程
ipcMain.handle("get-mods", async (_event, modSourcePath) => {
  return fs.readdirSync(modSourcePath);  // modSourcePath 是 any
});

// 渲染进程
const mods = await ipcRenderer.invoke("get-mods", "/path/to/mods");
// mods 是 any，不知道是什么类型
```

### 新代码（类型安全）

```typescript
// 主进程
ipc.handle(IPC.mod.list, async (event, source) => {
  const safe = parseModSourcePath(source);  // 运行时校验
  return fs.readdirSync(safe) as ModName[];  // 类型明确
});

// 渲染进程
const mods: ModName[] = await ipc.mod.list(asModSourcePath("/path/to/mods"));
// 编译器知道 mods 是 ModName[]
```

### 迁移步骤

1. **不改现有代码，先跑通测试**：确认 `bun test` 全部通过
2. **逐模块替换**：从最深层的工具函数开始，逐步向外替换
3. **主进程优先**：先迁移主进程 handler（添加 `parse*` 校验），再迁移渲染进程调用
4. **一次一个 channel**：每次只迁移一个 channel，提交一次，确保可回退

### 关键迁移点

| 旧文件 | 旧模式 | 新模式 |
|--------|--------|--------|
| `apps/electron/src/main.js` | `ipcMain.handle("get-mods", ...)` | `ipc.handle(IPC.mod.list, ...)` |
| `apps/electron/src/fileSystem.js` | `ipcMain.handle("fs-read-file", ...)` | `ipc.handle(IPC.fs.readFile, ...)` |
| `apps/desktop/vault/src/main.js` | `ipcRenderer.invoke("get-mods", ...)` | `ipc.mod.list(...)` |
| `apps/electron/src/fsProxy.js` | `ipcRenderer.invoke("fs-read-file", ...)` | `ipc.fs.readFile(...)` |
| `apps/electron/src/IManager.js` | `ipcRenderer.on("wakeUp", ...)` | `ipc.on(IPC.lifecycle.wakeUp, ...)` |

## 运行测试

```bash
# IPC 层测试
bun test packages/ipc/src/ipc.test.ts

# 类型定义测试
bun test packages/types/src/types.test.ts

# 类型检查
bun run typecheck
```
