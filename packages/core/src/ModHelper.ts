const fs = require("node:fs");
const path = require("node:path");
const { ipcRenderer } = require("electron");

import { createClient, IPC } from "@xxmm/ipc";
import { AppEvents } from "@xxmm/events";
import type { EventBus } from "@xxmm/events";
import { ImageHelper } from "@xxmm/helper/ImageHelper";
import type { ModInfo } from "./ModInfo";
import ModLoader from "./ModLoader";

const ipc = createClient(IPC);

let _count = 0;
class ImageBase64 {
  private base64WithHeader: string = "";
  public get = () => this.base64WithHeader;
  public set = (base64WithHeader: string) => {
    this.base64WithHeader = base64WithHeader;
    _count++;
  };

  public withoutHeader = () => this.base64WithHeader.split(",")[1];
  public getExt = () => this.base64WithHeader.split(";")[0].split("/")[1];
  public clear = () => (this.base64WithHeader = "");
  public isEmpty = () => this.base64WithHeader === "";

  constructor(base64WithHeader: string) {
    this.base64WithHeader = base64WithHeader;
  }
}

class ModData {
  public name: string;
  public character: string;
  public description: string;
  public url: string;
  public preview: string;
  public hotkeys: { key: string; description: string }[];

  private index = 0;
  private static indexCount = 0;

  public id: string = "";

  private modSourcePath: string = "";
  private oldPreview = "";
  public modPreviewBase64WithHeader: ImageBase64 = new ImageBase64("");

  constructor(
    name: string,
    character: string,
    description: string,
    url: string,
    preview: string,
    hotkeys: { key: string; description: string }[],
  ) {
    this.name = name;
    this.character = character;
    this.description = description;
    this.url = url;
    this.preview = preview;
    this.hotkeys = hotkeys;

    this.modSourcePath = "";
    this.oldPreview = "";
    this.modPreviewBase64WithHeader = new ImageBase64("");

    this.index = ModData.indexCount;
    ModData.indexCount++;
  }

  public destroy() {
    this.modPreviewBase64WithHeader.clear();
    ImageHelper.clearImageCache();
  }

  setModSourcePath(modSourcePath: string) {
    this.modSourcePath = modSourcePath;
    return this;
  }
  getModSourcePath() {
    return this.modSourcePath;
  }

  public static fromJson(json: any): ModData {
    if (!json.name) {
      throw new Error("ModData.fromJson: name is required");
    }
    return new ModData(
      json.name,
      json.character || "Unknown",
      json.description || "no description",
      json.url || "",
      json.preview || "",
      json.hotkeys || [],
    );
  }

  public toJson(): any {
    return {
      name: this.name,
      character: this.character,
      description: this.description,
      url: this.url,
      preview: this.preview,
      hotkeys: this.hotkeys,
    };
  }

  public static fromModInfo(modInfo: ModInfo): ModData {
    const modData = new ModData(
      JSON.parse(JSON.stringify(modInfo.metaData.get("name") || modInfo.modName)),
      JSON.parse(JSON.stringify(modInfo.metaData.get("character") || "Unknown")),
      JSON.parse(JSON.stringify(modInfo.metaData.get("description") || "no description")),
      JSON.parse(JSON.stringify(modInfo.metaData.get("url") || "no url")),
      "",
      JSON.parse(JSON.stringify(modInfo.metaData.get("hotkeys") || [])),
    );

    modData.id = modInfo.id;

    ModData.handlePreview(modData, modInfo);
    return modData;
  }

  static calcPreviewPath(modPath: string, previewName: string) {
    let previewPath = "";
    if (previewName) {
      previewPath = path.join(modPath, previewName);
    }
    if (!previewPath || !fs.existsSync(previewPath) || !previewName) {
      const previewFiles = fs.readdirSync(modPath);
      const previewFile = previewFiles.find((file: string) =>
        file.startsWith("preview"),
      );
      if (previewFile) {
        previewPath = path.join(modPath, previewFile);
      } else {
        const imageFiles = previewFiles.filter(
          (file: string) =>
            file.endsWith(".png") ||
            file.endsWith(".jpg") ||
            file.endsWith(".jpeg") ||
            file.endsWith(".gif") ||
            file.endsWith(".bmp") ||
            file.endsWith(".webp"),
        );
        if (imageFiles.length > 0) {
          previewPath = path.join(modPath, imageFiles[0]!);
        }
      }
    }
    if (!previewPath || !fs.existsSync(previewPath)) {
      previewPath = path.resolve("./src/assets/default.png");
    }

    return previewPath;
  }

  static handlePreview(modData: ModData, modInfo: ModInfo) {
    const previewName = modInfo.metaData.get("preview") || "";
    const modPath =
      ModLoader.getModByID(modData.id)?.location ||
      modData.getModPathSync() ||
      "";
    if (!modPath) {
      throw new Error(
        "ModData.handlePreview: modPath is required, please call setModSourcePath() first",
      );
    }
    const previewPath = ModData.calcPreviewPath(modPath, previewName);

    if (!modData.preview || !fs.existsSync(modData.preview)) {
      modData.preview = previewPath;
    }
  }

  public copy(): ModData {
    const newModData = new ModData(
      this.name,
      this.character,
      this.description,
      this.url,
      this.preview,
      JSON.parse(JSON.stringify(this.hotkeys)),
    ).setModSourcePath(this.modSourcePath);
    newModData.id = this.id;
    newModData.index = this.index;

    return newModData;
  }

  public equals(modData: ModData): boolean {
    console.log(
      `comparing......`,
      new Error(),
      this.index,
      this.toJson(),
      modData.index,
      modData.toJson(),
    );
    return JSON.stringify(this.toJson()) === JSON.stringify(modData.toJson());
  }

  public print(): string {
    let hotkeysString = "";
    this.hotkeys.forEach((hotkey) => {
      hotkeysString += `${hotkey.key} - ${hotkey.description}\n`;
    });
    return `🉑Name: ${this.name}\nCharacter: ${this.character}\nDescription: ${this.description}\nURL: ${this.url}\nPreview: ${this.preview}\nHotkeys:\n${hotkeysString}`;
  }

  private async checkModSourcePath() {
    if (!this.modSourcePath) {
      throw new Error(
        "ModData.checkModSourcePath: modSourcePath is required, please call setModSourcePath() first",
      );
    } else if (!fs.existsSync(this.modSourcePath)) {
      throw new Error(
        "ModData.checkModSourcePath: modSourcePath does not exist",
      );
    }
  }

  public async setPreviewByPath(previewPath: string) {
    await this.checkModSourcePath();

    const previeFileName = path.basename(previewPath);
    const previewDest = path.join(this.getModPathSync(), previeFileName);
    fs.copyFileSync(previewPath, previewDest);
    this.preview = previewDest;

    this.oldPreview = "";
    this.modPreviewBase64WithHeader.clear();
  }

  public async setPreviewByBase64(previewBase64: string) {
    await this.checkModSourcePath();

    this.modPreviewBase64WithHeader.set(previewBase64);

    const imageDest = path.join(
      this.getModPathSync(),
      `preview.${this.modPreviewBase64WithHeader.getExt()}`,
    );

    fs.writeFileSync(
      imageDest,
      this.modPreviewBase64WithHeader.withoutHeader(),
      "base64",
    );

    this.preview = imageDest;
    this.oldPreview = imageDest;

    ipc.app.snack(`Updated cover for ${this.name}`, "info");

    return imageDest;
  }

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
    this.hotkeys.push({ key, description });
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

  public async saveModInfoOld() {
    await this.checkModSourcePath();
    const modSourcePath = this.modSourcePath;

    const jsonModInfo = JSON.stringify(this.toJson(), null, 4);
    console.log(`ModData.saveModInfo: ${this.name}`, this, jsonModInfo);
    await ipcRenderer.invoke("save-mod-info", modSourcePath, jsonModInfo);
  }

  public async saveModInfo() {
    await this.checkModSourcePath();

    if (!this.id) {
      throw new Error(
        "ModData.saveModInfo: id is required, please check if the mod is loaded",
      );
    }
    const modInfo = ModLoader.getModByID(this.id);

    if (!modInfo) {
      throw new Error(
        "ModData.saveModInfo: modInfo is not found, please check if the mod is loaded",
      );
    }

    console.log(`ModData.saveModInfo: ${this.name}`, this, this.toJson());

    const modInfoJson = JSON.parse(JSON.stringify(this.toJson()));
    const previewName = path.basename(this.preview);
    modInfoJson.preview = previewName;

    console.log(`ModData.saveModInfo: ${this.name}`, this, modInfoJson);
    modInfo.setMetaDataFromJson(modInfoJson);
    modInfo.saveMetaData();
  }

  public async getPreviewBase64(ifWithHeader: boolean = false) {
    if (!this.preview) {
      return "";
    }
    if (
      this.preview === this.oldPreview &&
      !this.modPreviewBase64WithHeader.isEmpty()
    ) {
      return ifWithHeader
        ? this.modPreviewBase64WithHeader.get()
        : this.modPreviewBase64WithHeader.withoutHeader();
    }
    this.oldPreview = this.preview;
    if (ifWithHeader) {
      return ImageHelper.getImageUrlFromLocalPath(
        this.getModPreviewPath(),
        true,
      );
    }

    this.modPreviewBase64WithHeader.set(
      "data:image/png;base64," +
        (await ipcRenderer.invoke("get-image", this.preview)),
    );
    return ifWithHeader
      ? this.modPreviewBase64WithHeader.get()
      : this.modPreviewBase64WithHeader.withoutHeader();
  }

  public getModPathSync() {
    if (!this.modSourcePath) {
      throw new Error(
        "ModData.getModPathSync: modSourcePath is required, please call setModSourcePath() first",
      );
    } else if (!fs.existsSync(this.modSourcePath)) {
      throw new Error("ModData.getModPathSync: modSourcePath does not exist");
    }

    return (
      ModLoader.getModByID(this.id)?.location ||
      path.join(this.modSourcePath, this.name)
    );
  }

  public async getModPath() {
    await this.checkModSourcePath();
    const modData = ModLoader.getModByID(this.id);
    if (modData) {
      if (modData.location) {
        return modData.location;
      } else {
        console.warn(`Didn't find location of modData ${this.id}`);
        return path.join(this.modSourcePath, this.name);
      }
    } else {
      console.warn(`Can't get modData of ${this.id}`);
      return path.join(this.modSourcePath, this.name);
    }
  }

  public getModPreviewPath() {
    if (!this.preview || !fs.existsSync(this.preview)) {
      this.preview = ModData.calcPreviewPath(
        this.getModPathSync(),
        this.preview,
      );
      console.log(`Recalculating preview path: ${this.preview}`);
    }
    return this.preview;
  }

  //-========== 触发事件 ===========
  // NOTE: bus 由调用方通过依赖注入传入
  public triggerChanged(bus?: EventBus) {
    bus?.emit(AppEvents.modInfoChanged, this);
  }
  public triggerCurrentModChanged(bus?: EventBus) {
    bus?.emit(AppEvents.currentModChanged, this);
  }
}

export { ModData };
