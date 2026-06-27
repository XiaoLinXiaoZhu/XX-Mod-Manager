import { ipcRenderer } from "electron";

const fs = require("node:fs");

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
      const buffer = fs.readFileSync(imagePath);
      const blob = new Blob([buffer], { type: "image/png" });
      const tempUrl = URL.createObjectURL(blob);
      ImageHelper.imageCache[imagePath] = tempUrl;
      return tempUrl;
    }
  }

  public static async clearImageCache() {
    for (const key in ImageHelper.imageCache) {
      URL.revokeObjectURL(ImageHelper.imageCache[key]!);
    }
    ImageHelper.imageCache = {};
  }
}

export { ImageHelper };
