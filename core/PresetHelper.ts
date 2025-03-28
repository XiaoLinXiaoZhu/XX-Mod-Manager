import { ModInfo, ModMetaData, ModMetaDataItem, ModMetaDataType } from "./ModInfo";
import ModLoader from "./ModLoader";
const fs = require('fs');
const path = require('path');
// 这个用来代替之前的直接读取文件夹的方式，改用PresetHelper来管理

// 预设文件夹下有n个文件，每个文件都是一个preset
// 用preset文件的名字作为preset展示的名字，实际上我们还是用id来标识preset
// preset文件的内容是一个json，包含了preset的所有信息
/* preset的结构
{
    "id": "presetId",
    "name": "presetName",
    "location": "presetLocation",
    "description": "presetDescription",
    "modIds": ["modId1", "modId2", ...],
        // 实验性功能的配置
    "useExperimentalFeature": true,
    "experimentalFeatureConfig": {
        // 继承其他preset的id
        "inheritPresets": ["presetId1", "presetId2", ...],
    }
}
*/
class Preset{
    id: string;
    name: string;
    location: string;
    description: string;
    modIds: string[];
    useExperimentalFeature: boolean;
    experimentalFeatureConfig: any;
    constructor(id: string, name: string, location: string, description: string, modIds: string[], useExperimentalFeature: boolean, experimentalFeatureConfig: any){
        // id 为 preset 的唯一标识，如果没有则生成一个
        this.id = id;
        this.name = name;
        this.location = location;
        this.description = description;
        this.modIds = modIds;
        this.useExperimentalFeature = useExperimentalFeature;
        this.experimentalFeatureConfig = experimentalFeatureConfig;
    }

    generateID() {
        // 生成一个随机的 id
        // id 由 mod文件夹内的文件的 hash 值生成

        // 生成一个 hash 值
        // hash 值的生成需要用到 crypto 模块
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');
        hash.update(this.location);
        this.id = hash.digest('hex');
        return this.id;
    }

    setLocation(location: string){
        this.location = location;
    }

    static fromJson(json: any){
        return new Preset(json.id, json.name, json.location, json.description, json.modIds, json.useExperimentalFeature, json.experimentalFeatureConfig);
    }

    static fromPath(location: string){
        try {
            const content = fs.readFileSync(location, 'utf-8');
            const json = JSON.parse(content);
            const newPreset = Preset.fromJson(json);
            newPreset.setLocation(location);
            return newPreset;
        } catch (error) {
            console.error(`Preset.fromPath: ${error}`);
            return null;
        }
    }

    getModIds(){
        return this.modIds;
    }

    public getModNames(){
        const modNames = this.modIds.map(modId => {
            const mod = ModLoader.mods.find(mod => mod.id === modId);
            return mod?.name || modId;
        }
        );
        // debug
        console.log(`getModNames: ${modNames}`);
        return modNames;
    }

    build(allPresets: Preset[]){
        // 如果没有id，则生成一个
        if (this.id === undefined){
            // 哈希碰撞的可能性很小，所以我们不检查重复
            this.generateID();
        }

        // name改为文件名，如果name有重复的则在后面加上数字
        const fileName = path.basename(this.location).slice(0, -5);
        this.name = fileName;
        // 检查是否有重复的name
        let sameNamePresets = allPresets.filter(p => p.name === this.name);
        if (sameNamePresets.length > 1){
            // 有重复的name，需要加上数字
            let index = 1;
            while (true){
                let newName = `${this.name}(${index})`;
                if (allPresets.find(p => p.name === newName) === undefined){
                    this.name = newName;
                    break;
                }
                index++;
            }
        }

        // // 为了支持继承，我们读取了所有的preset之后再调用一次build
        // if (this.useExperimentalFeature){
        //     if (this.experimentalFeatureConfig.inheritPresets !== undefined){
        //         this.experimentalFeatureConfig.inheritPresets.forEach((id: string) => {
        //             let preset = allPresets.find(p => p.id === id);
        //             if (preset !== undefined){
        //                 this.modIds = this.modIds.concat(preset.modIds);
        //             }
        //         });
        //     }
        // }

        // 去重
        this.modIds = [...new Set(this.modIds)];
    }
}
class PresetHelper{
    static presets: Preset[] = [];
    static loadPresets(folders: string[]){
        // clear all presets
        PresetHelper.presets = [];

        // debug
        console.log(`load preset from folders: ${folders}`);
        if (folders === undefined || folders === null || folders.length === 0){
            console.warn('PresetHelper.loadPreset: no preset folder');
            return;
        }

        folders.forEach(folder => {
            if (fs.existsSync(folder)) {
            const files = fs.readdirSync(folder);
            files.forEach(file => {
                const filePath = path.join(folder, file);
                if (fs.statSync(filePath).isFile() && path.extname(file) === '.json') {
                    const preset = Preset.fromPath(filePath);
                    if (preset !== null){
                        PresetHelper.presets.push(preset);
                    }
                }
            });
            } else {
            console.warn(`Folder does not exist: ${folder}`);
            }
        });

        // Build all presets after loading
        PresetHelper.presets.forEach(preset => preset.build(PresetHelper.presets));
    }

    static getPresetList(){
        // 返回所有preset的名称
        return PresetHelper.presets.map(preset => preset.name);
    }

    static readonly defaultPresetName = "default";
    static getPresetByName(name: string){
        if (name === PresetHelper.defaultPresetName){
            // 警告一下，返回一个空
            console.warn(`PresetHelper.getPresetByName: ${name} is default preset, return empty preset`);
            return new Preset("", "", "", "", [], false, {});
        }
        
        return PresetHelper.presets.find(preset => preset.name === name);
    }

    static getPresetById(id: string){
        return PresetHelper.presets.find(preset => preset.id === id);
    }

}


export default PresetHelper;