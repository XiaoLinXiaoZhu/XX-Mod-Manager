import { EventSystem,EventType } from './EventSystem';
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

class ImageHelper {
    private static imageCache: {[key: string]: string} = {};
    public static async getImageBase64(imagePath: string) {
        return "data:image/png;base64," + await ipcRenderer.invoke('get-image', imagePath);
    }
    public static async getImageUrlFromLocalPath(imagePath: string, ifCache: boolean = true) {
        if (ifCache && this.imageCache[imagePath]) {
            return this.imageCache[imagePath];
        }
        else {
            const bufffer = fs.readFileSync(imagePath);
            const blob = new Blob([bufffer], {type: "image/png"});
            const tempUrl = URL.createObjectURL(blob);
            this.imageCache[imagePath] = tempUrl;
            return tempUrl;
        }
    }
    public static async clearImageCache() {
        // 清空 创建的临时url
        for (const key in this.imageCache) {
            URL.revokeObjectURL(this.imageCache[key]);
        }
        this.imageCache = {};
    }
}

EventSystem.on(EventType.windowSleep, async() => {
    ImageHelper.clearImageCache();
}
);

export { ImageHelper };