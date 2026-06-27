// ModHelper.ts — Mod 数据模型

import { ipcRenderer } from "electron";
import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asDirPath } from "@xxmm/types";
import { AppEvents } from "@xxmm/events";
import type { EventBus } from "@xxmm/events";
import { ImageHelper } from "@xxmm/helper/ImageHelper";
import { joinPath, basename } from "@xxmm/helper/PathUtil";
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

  public withoutHeader = () => this.base64WithHeader.split(",")[1] ?? "";
  public getExt = () => this.base64WithHeader.split(";")[0]?.split("/")[1] ?? "png";
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

    // preview is resolved lazily by getModPreviewPath / getPreviewBase64
    const previewName = String(modInfo.metaData.get("preview") ?? "");
    if (previewName) {
      modData.preview = previewName;
    }

    return modData;
  }

  static async calcPreviewPath(modPath: string, previewName: string): Promise<string> {
    if (previewName) {
      const candidate = joinPath(modPath, previewName);
      if (await ipc.fs.exists(asFilePath(candidate))) {
        return candidate;
      }
    }

    const files = await ipc.fs.readDir(asDirPath(modPath));
    const previewFile = files.find((f: string) => f.startsWith("preview"));
    if (previewFile) {
      return joinPath(modPath, previewFile);
    }

    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
    const imageFile = files.find((f: string) =>
      imageExts.some((ext) => f.toLowerCase().endsWith(ext)),
    );
    if (imageFile) {
      return joinPath(modPath, imageFile);
    }

    // fallback
    return "./src/assets/default.png";
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
    return JSON.stringify(this.toJson()) === JSON.stringify(modData.toJson());
  }

  public print(): string {
    let hotkeysString = "";
    this.hotkeys.forEach((hotkey) => {
      hotkeysString += `${hotkey.key} - ${hotkey.description}\n`;
    });
    return `Name: ${this.name}\nCharacter: ${this.character}\nDescription: ${this.description}\nURL: ${this.url}\nPreview: ${this.preview}\nHotkeys:\n${hotkeysString}`;
  }

  private async checkModSourcePath() {
    if (!this.modSourcePath) {
      throw new Error("modSourcePath is required");
    }
    if (!(await ipc.fs.exists(asFilePath(this.modSourcePath)))) {
      throw new Error("modSourcePath does not exist");
    }
  }

  public async setPreviewByPath(previewPath: string) {
    await this.checkModSourcePath();
    const previeFileName = basename(previewPath);
    const previewDest = joinPath(await this.getModPath(), previeFileName);
    await ipc.fs.copyFile(asFilePath(previewPath), asFilePath(previewDest));
    this.preview = previewDest;
    this.oldPreview = "";
    this.modPreviewBase64WithHeader.clear();
  }

  public async setPreviewByBase64(previewBase64: string) {
    await this.checkModSourcePath();
    this.modPreviewBase64WithHeader.set(previewBase64);

    const imageDest = joinPath(
      await this.getModPath(),
      `preview.${this.modPreviewBase64WithHeader.getExt()}`,
    );

    // NOTE: writeFile with base64 requires raw buffer support; using IPC writeFile with base64 string
    await ipc.fs.writeFile(asFilePath(imageDest), this.modPreviewBase64WithHeader.withoutHeader());

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
    if (!key && !description) return;
    this.hotkeys.push({ key, description });
  }

  public async removeHotkey(key: string) {
    const index = this.hotkeys.findIndex((h) => h.key === key);
    if (index !== -1) this.hotkeys.splice(index, 1);
  }

  public async saveModInfo() {
    await this.checkModSourcePath();
    if (!this.id) throw new Error("id is required");

    const modInfo = ModLoader.getModByID(this.id);
    if (!modInfo) throw new Error("modInfo not found");

    const modInfoJson = JSON.parse(JSON.stringify(this.toJson()));
    modInfoJson.preview = basename(this.preview);

    modInfo.setMetaDataFromJson(modInfoJson);
    modInfo.saveMetaData();
  }

  public async getPreviewBase64(ifWithHeader: boolean = false) {
    if (!this.preview) return "";
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
        await this.getModPreviewPath(),
        true,
      );
    }

    const img = await ipcRenderer.invoke("get-image", this.preview);
    this.modPreviewBase64WithHeader.set(`data:image/png;base64,${img}`);
    return ifWithHeader
      ? this.modPreviewBase64WithHeader.get()
      : this.modPreviewBase64WithHeader.withoutHeader();
  }

  public async getModPath() {
    await this.checkModSourcePath();
    const modData = ModLoader.getModByID(this.id);
    if (modData?.location) {
      return modData.location;
    }
    return joinPath(this.modSourcePath, this.name);
  }

  public async getModPreviewPath() {
    const modPath = await this.getModPath();
    if (!this.preview || !(await ipc.fs.exists(asFilePath(this.preview)))) {
      this.preview = await ModData.calcPreviewPath(modPath, this.preview);
    }
    return this.preview;
  }

  //-========== 触发事件（EventBus 由调用方注入）==========
  public triggerChanged(bus?: EventBus) {
    bus?.emit(AppEvents.modInfoChanged, this);
  }
  public triggerCurrentModChanged(bus?: EventBus) {
    bus?.emit(AppEvents.currentModChanged, this);
  }
}

export { ModData };
