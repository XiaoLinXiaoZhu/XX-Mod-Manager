
class ModData {
    public name: string;
    public character: string;
    public description: string; 
    public url: string;
    public preview: string;
    public hotkeys: {key: string;description: string;}[];

    constructor(name: string, character: string, description: string, url: string, preview: string, hotkeys: {key: string;description: string;}[]) {
        this.name = name;
        this.character = character;
        this.description = description;
        this.url = url;
        this.preview = preview;
        this.hotkeys = hotkeys;
    }

    public static fromJson(json: any): ModData {
        return new ModData(json.name, json.character, json.description, json.url, json.preview, json.hotkeys);
    }
}

export {ModData};