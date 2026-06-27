import { EventSystem, EventType } from "./EventSystem";

const fs = require("node:fs");
const _path = require("node:path");
const { ipcRenderer } = require("electron");

class ImageHelper {
  private static imageCache: { [key: string]: string } = {};
  /** @deprecated 纯 IPC 二次转接，下游应直接使用 createClient(IPC).mod.getImage(imagePath) */
  public static async getImageBase64(imagePath: string) {
    return (
      "data:image/png;base64," +
      (await ipcRenderer.invoke("get-image", imagePath))
    );
  }
  public static async getImageUrlFromLocalPath(
    imagePath: string,
    ifCache: boolean = true,
  ) {
    if (ifCache && ImageHelper.imageCache[imagePath]) {
      return ImageHelper.imageCache[imagePath];
    } else {
      const bufffer = fs.readFileSync(imagePath);
      const blob = new Blob([bufffer], { type: "image/png" });
      const tempUrl = URL.createObjectURL(blob);
      ImageHelper.imageCache[imagePath] = tempUrl;
      return tempUrl;
    }
  }
  public static async clearImageCache() {
    // 清空 创建的临时url
    for (const key in ImageHelper.imageCache) {
      URL.revokeObjectURL(ImageHelper.imageCache[key]);
    }
    ImageHelper.imageCache = {};
  }
}

EventSystem.on(EventType.windowSleep, async () => {
  ImageHelper.clearImageCache();
});

export { ImageHelper };
