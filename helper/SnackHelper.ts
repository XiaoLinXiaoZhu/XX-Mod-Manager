const { ipcRenderer} = require('electron');
import { TranslatedText } from "./Language";   


/* @enum
 * @desc 用于标记 Snack 的类型
 */
enum SnackType {
    info = 'info',
    error = 'error',
}

/** @function   
 * @desc 弹出 Snack 提示    
 * @param {string} message
 * @param {SnackType} type 
 */
function snack(message: string, type: SnackType = SnackType.info) {
    ipcRenderer.send('snack', message, type);
}

/** @function
 * @desc 弹出 Snack 提示，会自动根据当前语言环境获取文本
 * @param {TranslatedText} message
 * @param {SnackType} type
 */
function t_snack(message: TranslatedText, type: SnackType = SnackType.info) {
    // 检查是否为 TranslatedText    
    if (!message || typeof message !== 'object' || !message.get) {
        message  = TranslatedText.fromObject(message);
    }
    snack(message.get(), type);
}


export { snack, t_snack, SnackType};