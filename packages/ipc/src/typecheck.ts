// 类型验证 — 确认品牌类型在 IPC 中的正确使用
// 运行: npx tsc --noEmit

import { createClient, IPC, createIPCMain } from "./index";
import {
  asFilePath,
  asDirPath,
  asModSourcePath,
  asModTargetPath,
  asImagePath,
  asModName,
  asModField,
  asPresetName,
  asPluginName,
  asBoundsStr,
  asCustomConfigFolder,
  // parse* — 用于主进程边界校验
  parseFilePath,
  parseDirPath,
  parseModSourcePath,
  parseModName,
  parseWindowBounds,
} from "@xxmm/types";

const ipc = createClient(IPC);

// === 渲染进程：使用 as* 构造品牌值 ===

async function testRenderer() {
  // window — 普通 void/boolean 参数无需品牌
  await ipc.window.minimize();
  const fullscreen: boolean = await ipc.window.toggleFullscreen();
  await ipc.window.setBounds(asBoundsStr('{"x":100,"y":200,"width":800,"height":600}'));

  // fs — 使用 asFilePath / asDirPath
  const content: string = await ipc.fs.readFile(asFilePath("/some/file.txt"));
  const entries: string[] = await ipc.fs.readDir(asDirPath("/some/dir"));
  const isDir: boolean = await ipc.fs.isDir(asDirPath("/some/dir"));
  await ipc.fs.writeFile(asFilePath("/f"), "data");

  // app
  const args = await ipc.app.getArgs();
  const devMode: boolean = args.devMode;
  ipc.app.snack("hello", "info");

  // mod — 使用 asModName / asModSourcePath / asModTargetPath
  const mods = await ipc.mod.list(asModSourcePath("/mods"));
  await ipc.mod.apply(
    [asModName("m1"), asModName("m2")],
    asModSourcePath("/src"),
    asModTargetPath("/dest"),
  );
  await ipc.mod.setInfo(asDirPath("/mod"), asModField("character"), "Diluc");
  await ipc.mod.getImage(asImagePath("/preview.png"));

  // preset
  const presets = await ipc.preset.list();
  await ipc.preset.save(asPresetName("myPreset"), [asModName("m1")]);

  // plugin
  const cfg = await ipc.plugin.getConfig(asPluginName("myPlugin"));

  // push — 通过 .on()
  const unsub = ipc.on(IPC.lifecycle.wakeUp, (_event) => {});
  unsub();
}

// === 主进程：使用 parse* 在边界校验 ===

const mainIPC = createIPCMain();

// handle handler 接收品牌类型，内部用 parse* 校验 + 收窄
mainIPC.handle(IPC.fs.readFile, async (_event, path) => {
  const safePath = parseFilePath(path); // 运行时校验：非空 string
  // safePath 已经是 FilePath 类型（编译时 + 运行时双重保证）
  return `content of ${safePath}`;
});

mainIPC.handle(IPC.fs.readDir, async (_event, path) => {
  const safePath = parseDirPath(path);
  return [safePath];
});

mainIPC.handle(IPC.mod.list, async (_event, source) => {
  const safe = parseModSourcePath(source);
  return [asModName("mod1"), asModName("mod2")];
});

mainIPC.handle(IPC.window.setBounds, async (_event, boundsStr) => {
  const bounds = parseWindowBounds(boundsStr); // 解析 JSON + 校验字段
  console.log(bounds.x, bounds.y, bounds.width, bounds.height);
});

// ---- 以下应报类型错误 ----

// ipc.fs.readFile("/plain/string");     // 不能传 plain string
// ipc.fs.readDir(asFilePath("/f"));      // asFilePath 不能当 DirPath
// ipc.mod.apply([asModName("m")], asDirPath("/d"), asDirPath("/d")); // DirPath ≠ ModSourcePath
