const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require('electron');

import { EventType,EventSystem } from "./EventSystem";
import { SnackType,snack,t_snack } from "./SnackHelper";
class ModData {
    public name: string;
    public character: string;
    public description: string; 
    public url: string;
    public preview: string;
    public hotkeys: {key: string;description: string;}[];

    public modSourcePath: string = ""; // mod的源路径

    constructor(name: string, character: string, description: string, url: string, preview: string, hotkeys: {key: string;description: string;}[]) {
        this.name = name;
        this.character = character;
        this.description = description;
        this.url = url;
        this.preview = preview;
        this.hotkeys = hotkeys;
    }
    setModSourcePath(modSourcePath: string) {
        this.modSourcePath = modSourcePath;
        return this;
    }

    public static fromJson(json: any): ModData {
        // mod 一定要有 name
        if (!json.name) {
            throw new Error("ModData.fromJson: name is required");
        }
        return new ModData(
            json.name,
            json.character || "unknown",
            json.description || "no description",
            json.url || "",
            json.preview || "",
            json.hotkeys || []
        );
    }
    public toJson(): any {
        return {
            name: this.name,
            character: this.character,
            description: this.description,
            url: this.url,
            preview: this.preview,
            hotkeys: this.hotkeys
        };
    }
    public copy(): ModData {    
        return new ModData(
            this.name,
            this.character,
            this.description,
            this.url,
            this.preview,
            this.hotkeys
        ).setModSourcePath(this.modSourcePath);
    }
    public equals(modData: ModData): boolean {
        return JSON.stringify(this.toJson()) === JSON.stringify(modData.toJson());
    }

    public print(): string {
        let hotkeysString = "";
        this.hotkeys.forEach((hotkey) => {
            hotkeysString += `${hotkey.key} - ${hotkey.description}\n`;
        });
        return `🉑Name: ${this.name}\nCharacter: ${this.character}\nDescription: ${this.description}\nURL: ${this.url}\nPreview: ${this.preview}\nHotkeys:\n${hotkeysString}`;
    }

    //-========== 编辑预览图 ===========
    private async checkModSourcePath() {
        if (!this.modSourcePath) {
            throw new Error("ModData.setPreviewBase64: modSourcePath is required, please call setModSourcePath() first");
        }
        else if (!fs.existsSync(this.modSourcePath)) {
            throw new Error("ModData.setPreviewBase64: modSourcePath does not exist");  
        }
    }
    public async setPreviewByPath(previewPath: string) {
        await this.checkModSourcePath();
        const modSourcePath = this.modSourcePath;

        // 将 previewPath 的 文件 复制到 modSourcePath 的 preview 文件夹下，并且将 mod 的 preview 属性设置为 previewPath，然后保存
        const previeFileName = path.basename(previewPath);
        const previewDest = path.join(modSourcePath, this.name, previeFileName);
        fs.copyFileSync(previewPath, previewDest);
        this.preview = previewDest;
    }

    public async setPreviewByBase64(previewBase64: string) {
        // 检查是否有 modSourcePath
        await this.checkModSourcePath();

        const modSourcePath = this.modSourcePath;

        const imageExt = previewBase64.split(";")[0].split("/")[1];
        const modImageName = `preview.${imageExt}`;
        const imageDest = path.join(modSourcePath, this.name, modImageName)

        fs.writeFileSync(imageDest, previewBase64.split(',')[1], 'base64');

        //debug
        this.preview = imageDest;

        // snack提示
        snack(`Updated cover for ${this.name}`, SnackType.info);

        // 返回 图片的路径
        return imageDest;
    }

    //-========== 编辑mod信息 ===========
    public editModInfo(newModData: ModData) {
        this.name = newModData.name;
        this.character = newModData.character;
        this.description = newModData.description;
        this.url = newModData.url;
        this.preview = newModData.preview;
        this.hotkeys = newModData.hotkeys;

        return this;
    }


    public async addHotkey(key: string, description: string) {
        if (!key && !description) {
            console.log("ModData.addHotkey: key and description are required");
            return;
        }
        this.hotkeys.push({key, description});
    }
    public async removeHotkey(key: string) {
        if (key === undefined) {
            console.log("ModData.removeHotkey: key is required");
            return;
        }
        const index = this.hotkeys.findIndex((hotkey) => hotkey.key === key);
        if (index !== -1) {
            this.hotkeys.splice(index, 1);
        }
    }

    //-========== 保存mod信息 ===========
    public async saveModInfo() {
        await this.checkModSourcePath();
        const modSourcePath = this.modSourcePath;

        //这里的 modInfo 是一个对象，不能直接传递给主进程
        //所以需要将 modInfo 转化为 json
        const jsonModInfo = JSON.stringify(this.toJson(), null, 4);
        await ipcRenderer.invoke('save-mod-info', modSourcePath, jsonModInfo);
    }

    //-========== 获取mod信息 ===========
    public async getPreviewBase64() {
        // await this.checkModSourcePath();
        const data = await ipcRenderer.invoke('get-image', this.preview);
        return data;  
    }

    public async triggerChanged(){
        EventSystem.trigger(EventType.modInfoChanged, this);
    }
    public async triggerCurrentModChanged(){    
        EventSystem.trigger(EventType.currentModChanged, this);
    }
}

export {ModData};