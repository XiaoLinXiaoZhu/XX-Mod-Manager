// ApplyMods.ts — Mod 应用逻辑（IPC 迁移版）
//
// 所有文件系统操作通过 @xxmm/ipc fs channels，路径操作使用 PathUtil。

import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asDirPath } from "@xxmm/types";
import { appI18n } from "@xxmm/helper/I18nConfig";
import {
  joinPath,
  basename,
  startsWith,
  stripPrefix,
  addPrefix,
} from "@xxmm/helper/PathUtil";
import { ModInfo } from "./ModInfo";
import ModLoader from "./ModLoader";

const ipc = createClient(IPC);

async function applyMods(
  modIds: string[],
  modSourcePath: string,
  modTargetPath: string,
) {
  // 检查 modSourcePath 和 modTargetPath
  if (!modSourcePath) {
    console.error("modSourcePath is empty.");
    ipc.app.snack(
      appI18n("modSourcePath 为空，请在 设置/高级设置 检查你的配置"),
      "error",
    );
    return;
  }
  if (!modTargetPath) {
    console.error("modTargetPath is empty.");
    ipc.app.snack(
      appI18n("modTargetPath 为空，请在 设置/高级设置 检查你的配置"),
      "error",
    );
    return;
  }
  if (modSourcePath === modTargetPath) {
    console.error("modSourcePath and modTargetPath are the same.");
    ipc.app.snack(
      appI18n(
        "在非传统模式下，modSourcePath 和 modTargetPath 不能是相同的，请在 设置/高级设置 检查你的配置，或者选择使用传统模式",
      ),
      "error",
    );
    return;
  }
  if (!(await ipc.fs.exists(asFilePath(modSourcePath)))) {
    console.error(`modSourcePath does not exist: ${modSourcePath}`);
    ipc.app.snack(
      appI18n`modSourcePath 不存在: ${modSourcePath}，请在 设置/高级设置 检查你的配置`,
      "error",
    );
    return;
  }
  if (!(await ipc.fs.exists(asFilePath(modTargetPath)))) {
    console.error(`modTargetPath does not exist: ${modTargetPath}`);
    ipc.app.snack(
      appI18n`modTargetPath 不存在: ${modTargetPath}，请在 设置/高级设置 检查你的配置`,
      "error",
    );
    return;
  }
  if (!(await ipc.fs.isDir(asDirPath(modSourcePath)))) {
    console.error(`modSourcePath is not a directory: ${modSourcePath}`);
    ipc.app.snack(
      appI18n`modSourcePath 不是一个目录: ${modSourcePath}，请在 设置/高级设置 检查你的配置`,
      "error",
    );
    return;
  }
  if (!(await ipc.fs.isDir(asDirPath(modTargetPath)))) {
    console.error(`modTargetPath is not a directory: ${modTargetPath}`);
    ipc.app.snack(
      appI18n`modTargetPath 不是一个目录: ${modTargetPath}，请在 设置/高级设置 检查你的配置`,
      "error",
    );
    return;
  }

  console.log("modIds", modIds);

  const allMod = ModLoader.modsRaw;

  const selectedMods = modIds
    .map((modId) => ModLoader.getModByID(modId))
    .filter((mod): mod is ModInfo => mod !== null);

  console.log("selectedMods", selectedMods);

  const notInAllMod = selectedMods.filter((mod) => !allMod.includes(mod));
  const notInSelectedMods = allMod.filter((mod) => !selectedMods.includes(mod));
  const inBoth = selectedMods.filter((mod) => allMod.includes(mod));

  console.log("notInAllMod", notInAllMod);
  console.log("notInSelectedMods", notInSelectedMods);
  console.log("inBoth", inBoth);

  if (notInAllMod.length > 0) {
    throw new Error(
      `The following mods are not in allMod: ${notInAllMod
        .map((mod) => mod.modName)
        .join(", ")}`,
    );
  }

  // 移除不在 selectedMods 中的 mod 的链接
  for (const mod of notInSelectedMods) {
    const modPath = joinPath(modTargetPath, mod.modName);
    if (await ipc.fs.exists(asFilePath(modPath))) {
      await ipc.fs.remove(asFilePath(modPath));
    }
  }

  // 为 inBoth 中的 mod 创建链接
  let hasError = false;
  for (const mod of inBoth) {
    const src = joinPath(modSourcePath, mod.modName);
    const dest = joinPath(modTargetPath, mod.modName);
    if (!(await ipc.fs.exists(asFilePath(dest)))) {
      try {
        await ipc.fs.symlink(asFilePath(src), asFilePath(dest), "junction");
      } catch (err) {
        console.error(err);
        hasError = true;
      }
    }
  }

  if (hasError) {
    ipc.app.snack(
      appI18n`无法在 ${modTargetPath} 中创建链接，请检查权限或是确认您的磁盘类型是否支持创建链接。或者您可以换用使用传统方式应用mod。`,
      "error",
    );
  }
}

async function applyModsTranditional(modIds: string[]) {
  if (ModInfo.ifKeepModNameAsModFolderName) {
    ipc.app.snack(
      appI18n("mod名称和mod文件夹名称一致，无法使用传统方式应用mod。"),
      "error",
    );
    return;
  }

  const allMod = ModLoader.modsRaw;

  const selectedMods = modIds
    .map((modId) => ModLoader.getModByID(modId))
    .filter((mod): mod is ModInfo => mod !== null);

  console.log("selectedMods", selectedMods);

  const notInAllMod = selectedMods.filter((mod) => !allMod.includes(mod));
  const notInSelectedMods = allMod.filter((mod) => !selectedMods.includes(mod));
  const inBoth = selectedMods.filter((mod) => allMod.includes(mod));

  if (notInAllMod.length > 0) {
    throw new Error(
      `The following mods are not in allMod: ${notInAllMod
        .map((mod) => mod.modName)
        .join(", ")}`,
    );
  }

  // 禁用未选中的 mod：添加 "disabled_" 前缀
  for (const mod of notInSelectedMods) {
    const modPath = mod.location;
    if (!(await ipc.fs.exists(asFilePath(modPath)))) continue;
    if (startsWith(modPath, "disabled_")) continue;

    const newModName = `disabled_${mod.modName}`;

    mod.rename(newModName, (err: any) => {
      if (err) {
        console.error(err);
        ipc.app.snack(
          appI18n`重命名mod文件夹 ${modPath} 失败，请检查权限。`,
          "error",
        );
      } else {
        ipc.app.snack(
          appI18n`将mod文件夹 ${modPath} 重命名为 ${addPrefix(modPath, "disabled_")}`,
          "info",
        );
      }
    });
  }

  // 启用选中的 mod：移除 "disabled_" 前缀
  for (const mod of inBoth) {
    const modPath = mod.location;
    if (!(await ipc.fs.exists(asFilePath(modPath)))) continue;
    if (!startsWith(modPath, "disabled_")) continue;

    const newModName = basename(modPath).replace("disabled_", "");

    mod.rename(newModName, (err: any) => {
      if (err) {
        console.error(err);
        ipc.app.snack(
          appI18n`重命名mod文件夹 ${modPath} 失败，请检查权限。`,
          "error",
        );
      } else {
        ipc.app.snack(
          appI18n`将mod文件夹 ${modPath} 重命名为 ${stripPrefix(modPath, "disabled_")}`,
          "info",
        );
      }
    });
  }
}

export { applyMods, applyModsTranditional };
