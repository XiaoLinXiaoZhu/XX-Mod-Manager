/** @enum
 * @desc 用于标记当前的语言环境
 */
enum Language {
    en = 'en',
    zh_cn = 'zh_cn',
}

// 保存一个全局的语言环境
let currentLanguage = Language.en;
function setCurrentLanguage(language: Language) {
    currentLanguage = language;
}

/** @class
 * @classdesc TranslatedText 用于简化多语言文本的获取
 * @param {string} enText - 英文文本
 * @param {string} cnText - 中文文本
 */
class TranslatedText {
    public enText : string;
    public cnText : string;

    constructor(enText: string, cnText: string) {
        this.enText = enText;
        this.cnText = cnText;
    }

    public getText(language: Language) {
        if (language === 'en') {
            return this.enText;
        } else if (language === 'zh_cn') {
            return this.cnText;
        }

        return this.enText;
    }

    /** @function
     * @desc 获取当前的文本，根据当前的语言环境
     * @returns {string} 当前的文本
     */
    public get() {
        return this.getText(currentLanguage);
    }
}




export { Language, TranslatedText, setCurrentLanguage };