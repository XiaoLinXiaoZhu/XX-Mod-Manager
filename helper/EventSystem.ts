//-==================== 事件管理 ====================
// 所有的事件：
//----------生命周期----------
// wakeUp,initDone
//----------状态变更----------
// themeChange,languageChange,
// lastClickedModChanged,
// modInfoChanged,
// currentCharacterChanged,
// currentPresetChanged,
// currentModChanged
//----------事件节点----------
// modsApplied,addMod,addPreset,toggledMod

/** @enum
 * @desc 分类用于标记所有的事件
*/
enum EventType {
    //----------生命周期----------
    wakeUp = 'wakeUp',
    initDone = 'initDone',
    //----------状态变更----------
    themeChange = 'themeChange',
    languageChange = 'languageChange',
    lastClickedModChanged = 'lastClickedModChanged',
    modInfoChanged = 'modInfoChanged',
    currentCharacterChanged = 'currentCharacterChanged',
    currentPresetChanged = 'currentPresetChanged',
    currentModChanged = 'currentModChanged',
    //----------事件节点----------
    modsApplied = 'modsApplied',
    addMod = 'addMod',
    addPreset = 'addPreset',
    toggledMod = 'toggledMod',
    //----------插件相关----------
    pluginEnabled = 'pluginEnabled',
    pluginDisabled = 'pluginDisabled',
}

class EventSystem {
    private static eventMap = new Map<EventType, Function[]>(); // 事件映射表

    static async on(event: EventType, callback: Function) {
        // 防止 eventMap 不存在 
        if (!EventSystem.eventMap) {
            EventSystem.eventMap = new Map<EventType, Function[]>();
        }
        if (!EventSystem.eventMap.has(event)) {
            EventSystem.eventMap.set(event, []);
        }
        EventSystem.eventMap.get(event)?.push(callback);
        // debug
        // console.log('eventMap:', EventSystem.eventMap);
    }

    static async off(event: EventType, callback: Function) {
        if (EventSystem.eventMap.has(event)) {
            let callbacks = EventSystem.eventMap.get(event);
            if (callbacks) {
                let index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }

    static async trigger(event: EventType, ...args: any[]) {
        if (EventSystem.eventMap.has(event)) {
            let callbacks = EventSystem.eventMap.get(event);
            if (callbacks) {
                for (let callback of callbacks) {
                    callback(...args);
                }
            }
        }
    }

    static async triggerSync(event: EventType, ...args: any[]) {
        if (EventSystem.eventMap.has(event)) {
            let callbacks = EventSystem.eventMap.get(event);
            if (callbacks) {
                for (let callback of callbacks) {
                    await callback(...args);
                }
            }
        }
    }

    static async clearAllEvents() {
        EventSystem.eventMap.clear();
    }
}

export { EventType, EventSystem };