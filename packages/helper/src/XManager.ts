// XManager.ts — 单例式 Manager（IPC 迁移版）

import { ipcRenderer } from "electron";
import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asDirPath } from "@xxmm/types";
import { appI18n, langState } from "./I18nConfig";
import { joinPath } from "./PathUtil";
import { EventSystem, EventType } from "./EventSystem";
import { IPluginLoader } from "./PluginLoader";
import type { ModData } from "@xxmm/core/ModHelper";

const ipc = createClient(IPC);

// libarchivejs（通过 window.Archive 注入）
let Archive = (window as any).Archive;

// HMC（Windows 底层 API）
// TODO: 迁移到 IPC channel
const HMC = (() => {
  try {
    return require("hmc-win32");
  } catch {
    console.warn("HMC not available");
    return null;
  }
})();

class XManager {
  private static instance: XManager;
  public static async getInstance() {
    if (!XManager.instance) {
      XManager.instance = new XManager();
    }
    return XManager.instance;
  }

  constructor() {
    Archive = (window as any).Archive;
    if (!Archive) {
      console.error("Archive is not defined");
      ipc.app.snack(appI18n("Archive 解压缩模块未找到"), "error");
    }

    XManager.instance = this;
    this.HMC = HMC;
    this.init();
  }

  // ===================== 核心数据 =====================

  public os = process.platform;
  public HMC: unknown = null;

  public config = {
    firstLoad: true,
    language: "zh_cn" as string,
    theme: "dark",
    modSourcePath: null as string | null,
    modTargetPath: null as string | null,
    presetPath: null as string | null,
    ifStartWithLastPreset: true,
    lastUsedPreset: null as string | null,
    bounds: {
      width: 800,
      height: 600,
      x: -1,
      y: -1,
    },
  };

  public data = {
    modList: [] as ModData[],
    presetList: [] as string[],
    characterList: [] as string[],
  };

  public temp = {
    lastClickedMod: null as ModData | null,
    currentMod: null as unknown as ModData,
    currentCharacter: null as string | null,
    currentTab: "mod",
    currentPreset: "default",
    wakeUped: false,
  };

  // ===================== 初始化 =====================

  private inited = false;
  private anouncedFinishInit = false;

  public async waitInit() {
    while (!this.inited) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (!this.anouncedFinishInit) {
      this.anouncedFinishInit = true;
      console.log("✅====== XManager init done ======✅");
    }
  }

  private clearInit() {
    this.inited = false;
    this.anouncedFinishInit = false;

    this.data = {
      modList: [],
      presetList: [],
      characterList: [],
    };

    EventSystem.clearAllEvents();
    IPluginLoader.clearAllPlugins();
  }

  async init() {
    this.clearInit();

    console.log("✅>> init XManager");
    await this.loadConfig();
    console.log("✅>> loadConfig done");

    await this.setWindowBounds();
    console.log("✅>> setWindowBounds done");

    EventSystem.trigger(EventType.languageChange, this.config.language);
    langState.set(this.config.language);
    console.log("✅>> languageChange to", this.config.language);

    EventSystem.trigger(EventType.themeChange, this.config.theme);
    console.log("✅>> themeChange to", this.config.theme);

    await this.loadMods();
    console.log("✅>> loadMods done");

    await this.loadPresets();
    console.log("✅>> loadPresets done");

    await IPluginLoader.Init(this);
    console.log("✅>> loadPlugins done");

    console.log("✅>> init IManager done");
    this.inited = true;

    setTimeout(() => {
      EventSystem.trigger(EventType.initDone, this);
      this.start();
    }, 200);
  }

  async start() {
    EventSystem.trigger(EventType.languageChange, this.config.language);
    langState.set(this.config.language);
    EventSystem.trigger(EventType.themeChange, this.config.theme);

    if (this.data.modList.length > 0) {
      this.setCurrentMod(this.data.modList[0]!);
      console.log("✅>> currentMod init", this.temp.currentMod);
    }

    if (this.config.ifStartWithLastPreset) {
      if (this.config.lastUsedPreset !== null) {
        console.log(
          "✅>> start with last preset:",
          this.config.lastUsedPreset,
        );
        this.setCurrentPreset(this.config.lastUsedPreset);
      } else {
        console.log("✅>> start with default preset");
        this.setCurrentPreset("default");
      }
    } else {
      console.log("✅>> start with default preset");
      this.setCurrentPreset("default");
    }
  }

  // ===================== 对外接口 状态变更 =====================

  async setLastClickedMod(_mod: ModData) {
    console.warn("setLastClickedMod is deprecated");
    throw new Error("setLastClickedMod is deprecated");
  }

  async setLastClickedModByName(_modName: string) {
    console.warn("setLastClickedModByName is deprecated");
    throw new Error("setLastClickedModByName is deprecated");
  }

  async setCurrentCharacter(character: string) {
    this.temp.currentCharacter = character;
    EventSystem.trigger(EventType.currentCharacterChanged, character);
    console.log(`currentCharacterChanged: ${character}`);
  }

  async setCurrentTab(tab: string) {
    this.temp.currentTab = tab;
    EventSystem.trigger(EventType.currentTabChanged, tab);
    console.log(`currentTabChanged: ${tab}`);
  }

  async setCurrentPreset(presetName: string) {
    this.temp.currentPreset = presetName;
    EventSystem.trigger(EventType.currentPresetChanged, presetName);
  }

  async setCurrentMod(mod: ModData) {
    this.temp.currentMod = mod;
    EventSystem.trigger(EventType.currentModChanged, mod);
  }

  async setCurrentModByName(modName: string) {
    const modInfo = await this.getModInfo(modName);
    if (!modInfo) {
      throw new Error(`Mod with name ${modName} not found`);
    }
    this.temp.currentMod = modInfo;
    console.log(`setCurrentModByName: ${modName}`, this.temp.currentMod);
    EventSystem.trigger(EventType.currentModChanged, this.temp.currentMod);
  }

  async toggledModByName(modName: string) {
    const mod = await this.getModInfo(modName);
    EventSystem.trigger(EventType.toggledMod, mod);
  }

  // ===================== 加载配置 =====================

  async loadConfig() {
    const currentConfig = await ipcRenderer.invoke("get-current-config");
    console.log(currentConfig);
    if (currentConfig == null || Object.keys(currentConfig).length === 0) {
      ipc.app.snack(appI18n("配置文件不存在"), "error");
      this.saveConfig();
      return;
    }

    Object.assign(this.config, currentConfig);
    this.saveConfig();

    langState.set(this.config.language);
  }

  async loadMods() {
    const modSourcePath = this.config.modSourcePath || "";
    console.log(appI18n`从 ${modSourcePath} 加载mod`);

    if (
      !modSourcePath ||
      typeof modSourcePath !== "string" ||
      !(await ipc.fs.exists(asFilePath(modSourcePath))) ||
      !(await ipc.fs.isDir(asDirPath(modSourcePath)))
    ) {
      ipc.app.snack(appI18n("Mod 源路径"), "error");
      return;
    }

    const loadMods: ModData[] = await ipcRenderer.invoke(
      "get-mods",
      modSourcePath,
    );

    if (loadMods.length === 0) {
      ipc.app.snack(appI18n("mod列表为空"), "error");
      return;
    }

    this.data.characterList = Array.from(
      new Set(loadMods.map((mod) => mod.character)),
    ).sort();
    this.data.modList = loadMods;

    console.log(loadMods);
    console.log(this.data.characterList);
    return loadMods;
  }

  async loadPresets() {
    const data = await ipcRenderer.invoke("get-preset-list");
    this.data.presetList = data as string[];
  }

  async loadPreset(presetName: string) {
    if (presetName === "default") {
      return [];
    }
    return [];
  }

  async getModInfo(modName: string) {
    return this.data.modList.find(
      (mod: { name: string }) => mod.name === modName,
    );
  }

  // ===================== 保存配置 =====================

  async saveConfig() {
    console.log("saveConfig:", this.config);
    await ipcRenderer.invoke("set-current-config", this.config);
  }

  saveConfigSync() {
    console.log("saveConfig:", this.config);
    ipcRenderer.invoke("set-current-config", this.config);
  }

  // ===================== 方法 =====================

  async setWindowBounds() {
    const bounds = this.config.bounds;
    console.log("setWindowBounds:", bounds);
    ipcRenderer.invoke("set-bounds", JSON.stringify(bounds));
  }

  // ===================== 对话框 =====================

  async showDialog(dialogID: string) {
    const dialog = document.getElementById(dialogID);
    if (!dialog) {
      console.log(`dialog ${dialogID} not found`);
      return;
    }
    (dialog as any).show();
  }

  async dismissDialog(dialogID: string) {
    const dialog = document.getElementById(dialogID);
    if (!dialog) {
      console.log(`dialog ${dialogID} not found`);
      return;
    }
    (dialog as any).dismiss?.();
  }
}

export { XManager };
