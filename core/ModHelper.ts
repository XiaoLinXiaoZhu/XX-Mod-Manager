const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require('electron');
import { ModInfo } from "./ModInfo";

import { EventType,EventSystem } from "../helper/EventSystem";
import { SnackType,snack,t_snack } from "../helper/SnackHelper";

import { ImageHelper } from "../helper/ImageHelper";
import ModLoader from "./ModLoader";
import { ModMetaDataType } from "./ModInfo";

let count = 0;
class ImageBase64 {
    private base64WithHeader: string = "";
    public get = () => this.base64WithHeader;
    public set = (base64WithHeader: string) =>{
        this.base64WithHeader = base64WithHeader;
        count ++ ;
    }

    public withoutHeader = () => this.base64WithHeader.split(',')[1];
    public getExt = () => this.base64WithHeader.split(";")[0].split("/")[1];
    public clear = () => this.base64WithHeader = "";
    public isEmpty = () => this.base64WithHeader === "";

    constructor(base64WithHeader: string) {
        this.base64WithHeader = base64WithHeader;
    }
}

// 每1s打印一次count
// setInterval(() => {
//     console.log(`imageBase64 count: ${count}`);
// }, 1000);


class ModData {
    public name: string;
    public character: string;
    public description: string; 
    public url: string;
    public preview: string;
    public hotkeys: {key: string;description: string;}[];

    private index = 0; // mod的id
    private static indexCount = 0; // mod的id计数器

    public id:string = ""; // mod的id

    private modSourcePath: string = ""; // mod的源路径
    private oldPreview = ""; // 旧的预览图的路径
    // public modPreviewBase64: string = ""; // mod的预览图的base64，不包含头部
    public modPreviewBase64WithHeader: ImageBase64 = new ImageBase64(""); // mod的预览图的base64，包含头部
    constructor(name: string, character: string, description: string, url: string, preview: string, hotkeys: {key: string;description: string;}[]) {
        this.name = name;
        this.character = character;
        this.description = description;
        this.url = url;
        this.preview = preview;
        this.hotkeys = hotkeys;

        this.modSourcePath = "";
        this.oldPreview = "";
        // this.modPreviewBase64 = "";
        this.modPreviewBase64WithHeader = new ImageBase64("");

        // 为每个mod生成一个id
        this.index = ModData.indexCount;
        ModData.indexCount ++;
        //debug
        // const stackTrace = new Error();
        // console.log(`ℹ️ℹ️ℹ️ModData ${this.name} is being created`,this.id,stackTrace)

        // 当进入休眠状态时，清空缓存
        EventSystem.on(EventType.windowSleep, async() => {
            this.oldPreview = "";
            // this.modPreviewBase64 = "";
            this.modPreviewBase64WithHeader.clear();
            
        });
    }
    // 析构函数
    public destroy() {
        this.modPreviewBase64WithHeader.clear();
        // this.modPreviewBase64 = "";

        // 释放资源
        ImageHelper.clearImageCache();

        // console.log(`🗑️🗑️🗑️ModData ${this.name} is being destroyed`,this.id);
    }

    setModSourcePath(modSourcePath: string) {
        this.modSourcePath = modSourcePath;
        return this;
    }
    getModSourcePath() {
        return this.modSourcePath;
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
    public static fromModInfo(modInfo: ModInfo): ModData {
        const modData = new ModData(
            JSON.parse(JSON.stringify(modInfo.metaData.get('name') || modInfo.modName)),
            JSON.parse(JSON.stringify(modInfo.metaData.get('character') || "unknow")),
            JSON.parse(JSON.stringify(modInfo.metaData.get('description') || "no description")),
            JSON.parse(JSON.stringify(modInfo.metaData.get('url') || "no url")),
            "", // preview will be handled below
            JSON.parse(JSON.stringify(modInfo.metaData.get('hotkeys') || []))
        );

        modData.id = modInfo.id;

        const handlePreview = () => {
            const previewName = modInfo.metaData.get('preview') || "";
            if (previewName) {
                // If there is a preview name, construct the path
                modData.preview = path.join(modInfo.location, previewName);
            }
            if (!modData.preview || !fs.existsSync(modData.preview) || !previewName) {
                // If no preview exists, search for a preview image in the mod folder
                const previewFiles = fs.readdirSync(modInfo.location);
                const previewFile = previewFiles.find(file => file.startsWith('preview'));
                if (previewFile) {
                    modData.preview = path.join(modInfo.location, previewFile);
                } else {
                    // If no preview image is found, look for the first image file
                    const imageFiles = previewFiles.filter(file =>
                        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') ||
                        file.endsWith('.gif') || file.endsWith('.bmp') || file.endsWith('.webp')
                    );
                    if (imageFiles.length > 0) {
                        modData.preview = path.join(modInfo.location, imageFiles[0]);
                    }
                }
            }
            // If no preview is found after all attempts, set a default image
            if (!modData.preview || !fs.existsSync(modData.preview)) {
                modData.preview = path.resolve('./src/assets/default.png');
            }
        };

        handlePreview();
        return modData;
    }
    public copy(): ModData {
        const newModData = new ModData(
            this.name,
            this.character,
            this.description,
            this.url,
            this.preview,
            // 这里需要深拷贝,不然传递的是一个引用
            JSON.parse(JSON.stringify(this.hotkeys))
        ).setModSourcePath(this.modSourcePath);
        newModData.id = this.id;
        newModData.index = this.index;

        return newModData;
    }
    public equals(modData: ModData): boolean {
        //debug
        console.log(`comparing......`,new Error(),this.index,this.toJson(),modData.index,modData.toJson());
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
            throw new Error("ModData.checkModSourcePath: modSourcePath is required, please call setModSourcePath() first");
        }
        else if (!fs.existsSync(this.modSourcePath)) {
            throw new Error("ModData.checkModSourcePath: modSourcePath does not exist");  
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

        // 清除旧的预览图
        this.oldPreview = "";
        // this.modPreviewBase64 = "";
        this.modPreviewBase64WithHeader.clear();
    }

    public async setPreviewByBase64(previewBase64: string) {
        // 检查是否有 modSourcePath
        await this.checkModSourcePath();

        const modSourcePath = this.modSourcePath;
        this.modPreviewBase64WithHeader.set(previewBase64);

        const imageDest = path.join(modSourcePath, this.name, `preview.${this.modPreviewBase64WithHeader.getExt()}`);

        fs.writeFileSync(imageDest, this.modPreviewBase64WithHeader.withoutHeader(), 'base64');

        //debug
        this.preview = imageDest;

        // 下次获取预览图时，直接返回这个base64
        this.oldPreview = imageDest;

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

        this.oldPreview = "";
        this.modPreviewBase64WithHeader.clear();

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
    public async saveModInfo2() {
        await this.checkModSourcePath();
        const modSourcePath = this.modSourcePath;

        //这里的 modInfo 是一个对象，不能直接传递给主进程
        //所以需要将 modInfo 转化为 json
        const jsonModInfo = JSON.stringify(this.toJson(), null, 4);
        //debug
        console.log(`ModData.saveModInfo: ${this.name}`,this, jsonModInfo);
        await ipcRenderer.invoke('save-mod-info', modSourcePath, jsonModInfo);
    }

    public async saveModInfo() {
        // 改用 modInfo 的 saveMetaData 方法来保存 mod 信息
        await this.checkModSourcePath();

        if (!this.id) {
            throw new Error("ModData.saveModInfo: id is required, please check if the mod is loaded");
        }
        const modInfo = ModLoader.getModByID(this.id);

        if (!modInfo) {
            throw new Error("ModData.saveModInfo: modInfo is not found, please check if the mod is loaded");
        }

        //debug
        console.log(`ModData.saveModInfo: ${this.name}`,this, this.toJson());

        // 保存 mod 信息，将this上所有的属性保存到 modInfo 上
        // 这里需要深拷贝，不然会传递引用
        const modInfoJson = JSON.parse(JSON.stringify(this.toJson()));
        // preview 不保存具体的路径，只保存文件名
        const previewName = path.basename(this.preview);
        modInfoJson.preview = previewName;

        //debug
        console.log(`ModData.saveModInfo: ${this.name}`,this, modInfoJson);
        // 保存 mod 信息
        modInfo.setMetaDataFromJson(modInfoJson);
        modInfo.saveMetaData();
    }

    //-========== 获取mod信息 ===========
    public async getPreviewBase64(ifWithHeader: boolean = false) {
        // 优化,改为使用ImageBase64类
        if(!this.preview){
            return "";
        }
        if(this.preview === this.oldPreview && !this.modPreviewBase64WithHeader.isEmpty()){
            return ifWithHeader ? this.modPreviewBase64WithHeader.get() : this.modPreviewBase64WithHeader.withoutHeader();
        }
        this.oldPreview = this.preview;
        if (ifWithHeader){
            // 1s 后 清理缓存
            // setTimeout(() => {
            //     ImageHelper.clearImageCache();
            // }, 1000);
            //debug
            return ImageHelper.getImageUrlFromLocalPath(this.preview);
        }

        this.modPreviewBase64WithHeader.set("data:image/png;base64," + await ipcRenderer.invoke('get-image', this.preview));
        return ifWithHeader ? this.modPreviewBase64WithHeader.get() : this.modPreviewBase64WithHeader.withoutHeader();
    }
    
    public async getModPath() {
        await this.checkModSourcePath();
        return path.join(this.modSourcePath, this.name);
    }






    //-========== 触发事件 ===========
    public async triggerChanged(){
        EventSystem.trigger(EventType.modInfoChanged, this);
    }
    public async triggerCurrentModChanged(){    
        EventSystem.trigger(EventType.currentModChanged, this);
    }
}

export {ModData};