import fs from 'fs';
import path from 'path';
import ErrorHandler from './ErrorHandler';
import { ModInfo } from './ModInfo';

function createMod(modPath) {
    const mod = new ModInfo(modPath);
    return mod;
}

function loadMods(modSourcePath) {
    const mods: ModInfo[] = [];

    ErrorHandler.create(() => {
        const files = fs.readdirSync(modSourcePath);
        for (const file of files) {
            const modPath = path.join(modSourcePath, file);
            if (fs.statSync(modPath).isDirectory()) {
                const mod = createMod(modPath);
                mods.push(mod);
            }
        }
    }).onErr((e) => {
        console.error(e);
    }).exec();

    return mods;
}

// 传进来 {type: 'load', data: string[]}
onmessage = (e) => {
    const { data, type } = e.data;
    if (type === 'load') {
        let result : ModInfo[] = [];
        for (const modSourcePath of data) {
            result.push(...loadMods(modSourcePath));
        }

        // 传回去 mod 数据
        postMessage({ type: 'finished', data: result });
    }
};

// 传回去初始化完成的消息
postMessage({ type: 'ready' });