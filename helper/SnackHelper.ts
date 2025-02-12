import { ipcRenderer } from "electron";
import { TranslatedText } from "./Language";   


/* @enum
 * @desc 用于标记 Snack 的类型
 */
enum SnackType {
    info = 'info',
    error = 'error',
}

function snack(message: string, type: SnackType) {
    ipcRenderer.send('snack', message, type);
}

function t_snack(message: TranslatedText, type: SnackType) {
    snack(message.get(), type);
}


export { snack, t_snack, SnackType};