import { ModInfo } from "./ModInfo";
import ModLoader from "./ModLoader";

import { SnackType, t_snack } from "../helper/SnackHelper";
import { TranslatedText } from "../helper/Language";

async function applyMods(
    modIds: string[],
    modSourcePath: string,
    modTargetPath: string
) {
    const fs = require('fs');
    const path = require('path');


    // 检查一下modSourcePath和modTargetPath是否存在，且不能为同一个文件夹
    if (modSourcePath === undefined || modSourcePath === null || modSourcePath === '') {
        const errorMessage = 'modSourcePath is empty. Please check your configuration in Settings/Advanced Settings.';
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, 'modSourcePath 为空，请在 设置/高级设置 检查你的配置'), SnackType.error);
        return;
    }
    if (modTargetPath === undefined || modTargetPath === null || modTargetPath === '') {
        const errorMessage = 'modTargetPath is empty. Please check your configuration in Settings/Advanced Settings.';
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, 'modTargetPath 为空，请在 设置/高级设置 检查你的配置'), SnackType.error);
        return;
    }
    if (modSourcePath === modTargetPath) {
        const errorMessage = 'modSourcePath and modTargetPath are the same. Please check your configuration in Settings/Advanced Settings.';
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, '在非传统模式下，modSourcePath 和 modTargetPath 不能是相同的，请在 设置/高级设置 检查你的配置，或者选择使用传统模式'), SnackType.error);
        return;
    }
    if (!fs.existsSync(modSourcePath)) {
        const errorMessage = `modSourcePath does not exist: ${modSourcePath}. Please check your configuration in Settings/Advanced Settings.`;
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, `modSourcePath 不存在: ${modSourcePath}，请在 设置/高级设置 检查你的配置`), SnackType.error);
        return;
    }
    if (!fs.existsSync(modTargetPath)) {
        const errorMessage = `modTargetPath does not exist: ${modTargetPath}. Please check your configuration in Settings/Advanced Settings.`;
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, `modTargetPath 不存在: ${modTargetPath}，请在 设置/高级设置 检查你的配置`), SnackType.error);
        return;
    }
    if (!fs.statSync(modSourcePath).isDirectory()) {
        const errorMessage = `modSourcePath is not a directory: ${modSourcePath}. Please check your configuration in Settings/Advanced Settings.`;
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, `modSourcePath 不是一个目录: ${modSourcePath}，请在 设置/高级设置 检查你的配置`), SnackType.error);
        return;
    }
    if (!fs.statSync(modTargetPath).isDirectory()) {
        const errorMessage = `modTargetPath is not a directory: ${modTargetPath}. Please check your configuration in Settings/Advanced Settings.`;
        console.error(errorMessage);
        t_snack(new TranslatedText(errorMessage, `modTargetPath 不是一个目录: ${modTargetPath}，请在 设置/高级设置 检查你的配置`), SnackType.error);
        return;
    }


    //debug
    console.log('modIds', modIds);

    

    // await ModLoader.loadMods();
    const allMod = ModLoader.modsRaw;
    
    const selectedMods = modIds.map((modId) => {
        const mod = ModLoader.getModByID(modId);
        return mod ? mod : null;
    }).filter(mod => mod !== null) as ModInfo[];

    console.log('selectedMods', selectedMods);

    // 计算三个值：
    // 1. 在allMod中没有但是存在于selectedMods中的mod
    // 2. 在allMod中存在但是不存在于selectedMods中的mod
    // 3. 在allMod中和selectedMods中都存在的mod
    const notInAllMod = selectedMods.filter(mod => !allMod.includes(mod));
    const notInSelectedMods = allMod.filter(mod => !selectedMods.includes(mod));
    const inBoth = selectedMods.filter(mod => allMod.includes(mod));

    // debug
    console.log('notInAllMod', notInAllMod);
    console.log('notInSelectedMods', notInSelectedMods);
    console.log('inBoth', inBoth);

    // 如果有不在allMod中的mod，抛出错误
    if (notInAllMod.length > 0) {
        throw new Error(`The following mods are not in allMod: ${notInAllMod.map(mod => mod.modName).join(', ')}`);
    }

    // 移除不在selectedMods中的mod
    notInSelectedMods.forEach(mod => {
        const modPath = path.join(modTargetPath, mod.modName);
        if (fs.existsSync(modPath)) {
            fs.rmdirSync(modPath, { recursive: true });
        }
    });

    // 为inBoth中的mod创建链接
    let isError = false;
    inBoth.forEach(mod => {
        const src = path.join(modSourcePath, mod.modName);
        const dest = path.join(modTargetPath, mod.modName);
        if (!fs.existsSync(dest)) {
            fs.symlinkSync(src, dest, 'junction', (err) => {
                if (err) {
                    console.log(err);
                    isError = true;
                }
            });
        }
    }
    );

    // 如果有错误，抛出错误
    if (isError || 1) {
        t_snack(new TranslatedText(
            `Failed to create link in ${modTargetPath}, please check permissions or confirm if your disk type supports creating links. Or you can use the traditional way to apply mod.`,
            `无法在 ${modTargetPath} 中创建链接，请检查权限或是确认您的磁盘类型是否支持创建链接。或者您可以换用使用传统方式应用mod。`
        ),SnackType.error);
    }
}

async function applyModsTranditional(
    modIds: string[]
){
    // 这个功能不需要SourcePath，只有一个TargetPath
    // 通过改变mod的文件夹的名字来实现
    // 当mod文件夹的名称前为”disabled_“时，表示该mod被禁用
    // 当mod文件夹的名称前部位为”disabled_“时，表示该mod被启用

    const fs = require('fs');
    const path = require('path');

    // 如果 开启了 mod名称和mod文件夹名称一致，将无法使用该功能，因为这里会需要修改文件夹名称
    if (ModInfo.ifKeepModNameAsModFolderName) {
        t_snack(new TranslatedText(
            `Mod name and mod folder name are the same, unable to use the traditional way to apply mod.`,
            `mod名称和mod文件夹名称一致，无法使用传统方式应用mod。`
        ),SnackType.error);
        return;
    }

    // await ModLoader.loadMods();
    const allMod = ModLoader.modsRaw;

    const selectedMods = modIds.map((modId) => {
        const mod = ModLoader.getModByID(modId);
        return mod ? mod : null;
    }).filter(mod => mod !== null) as ModInfo[];

    console.log('selectedMods', selectedMods);

    // 计算三个值：
    // 1. 在allMod中没有但是存在于selectedMods中的mod
    // 2. 在allMod中存在但是不存在于selectedMods中的mod
    // 3. 在allMod中和selectedMods中都存在的mod
    const notInAllMod = selectedMods.filter(mod => !allMod.includes(mod));
    const notInSelectedMods = allMod.filter(mod => !selectedMods.includes(mod));
    const inBoth = selectedMods.filter(mod => allMod.includes(mod));

    // debug
    console.log('notInAllMod', notInAllMod);
    console.log('notInSelectedMods', notInSelectedMods);
    console.log('inBoth', inBoth);

    // 如果有不在allMod中的mod，抛出错误
    if (notInAllMod.length > 0) {
        throw new Error(`The following mods are not in allMod: ${notInAllMod.map(mod => mod.modName).join(', ')}`);
    }

    // 为不在selectedMods中的mod的文件夹名称添加前缀”disabled_“
    notInSelectedMods.forEach(mod => {
        const modPath = mod.location;
        if (fs.existsSync(modPath)) {
            // 如果文件夹名称前缀已经是”disabled_“，则不需要修改
            if (path.basename(modPath).startsWith('disabled_')) {
                return;
            }
            const newModName = `disabled_${mod.modName}`;
            // fs.renameSync(modPath, newModPath);
            mod.rename(newModName, (err: any) => {
                if (err) {
                    console.log(err);
                    t_snack(new TranslatedText(
                        `Failed to rename mod folder ${modPath}, please check permissions.`,
                        `重命名mod文件夹 ${modPath} 失败，请检查权限。`
                    ),SnackType.error);
                } else {
                    t_snack(new TranslatedText(
                        `Renamed mod folder ${modPath} to ${newModName}`,
                        `将mod文件夹 ${modPath} 重命名为 ${newModName}`
                    ),SnackType.info);
                }
            });
        }
    });

    // 为inBoth中的mod的文件夹名称添加移除前缀”disabled_“
    inBoth.forEach(mod => {
        const modPath = mod.location;
        if (fs.existsSync(modPath)) {
            // 如果文件夹名称前缀已经不是”disabled_“，则不需要修改
            if (!path.basename(modPath).startsWith('disabled_')) {
                return;
            }
            const newModName = path.basename(modPath).replace('disabled_', '')
            // fs.renameSync(modPath, newModPath);
            mod.rename(newModName, (err: any) => {
                if (err) {
                    console.log(err);
                    t_snack(new TranslatedText(
                        `Failed to rename mod folder ${modPath}, please check permissions.`,
                        `重命名mod文件夹 ${modPath} 失败，请检查权限。`
                    ),SnackType.error);
                } else {
                    t_snack(new TranslatedText(
                        `Renamed mod folder ${modPath} to ${newModName}`,
                        `将mod文件夹 ${modPath} 重命名为 ${newModName}`
                    ),SnackType.info);
                }
            });
        }
    });

    // 重命名完成之后，文件位置可能会发生变化，所以需要重新加载mod
    // ModLoader.loadMods()
}

export {applyMods, applyModsTranditional};