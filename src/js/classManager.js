// 给其他的所有的 class 提供一个统一的管理器， 他提供下列功能：
// 1. 监听 页面初始化
// 2. 监听 class 的 对象的创建和销毁， 将 items 托管在管理器中
// 3. 提供一个 update 方法， 用于 执行 class 对应的 更新方法

// ClassManagerService 是一个单例模式， 用于管理所有的 ClassManager 对象, 他提供下列功能：
// 1. 监听 页面初始化
// 2. 监听 class 的 对象的创建和销毁， 将 items 托管在管理器中
// 3. 提供一个 update 方法， 用于 执行 class 对应的 更新方法



//-============ 优化：如果窗口睡眠就停止刷新 ==========
let isSleep = false;
import { EventSystem, EventType } from "../../helper/EventSystem";

EventSystem.on('windowFocus',()=>{ isSleep = false;});
EventSystem.on('windowSleep',()=>{ isSleep = true;});

class ClassManagerService {
    items = [];
    constructor() {
        this.items = [];
    }
    static instance = null;
    // static Instance = {
    //     get prop(){
    //         return ClassManagerService.instance;
    //     },
    //     set prop(value){
    //         throw new Error('Cannot set instance');
    //     }
    // }

    add(item) {
        this.items.push(item);
    }

    remove(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    update() {
        requestAnimationFrame(this.update.bind(this));
        //debug

        // refresh items
        if (this.items.length === 0 || isSleep){
            return;
        }
        this.items.forEach(item => {
            if ( !item.hasBuild ) {
                item.build();
            }
            if (item.needRefresh) {
                item.refresh();
            }
            item.onUpdate();
        });
    }

    onPageInit() {
        this.items.forEach(item => {
            item.onPageInit();
        });
    }
}

ClassManagerService.instance = new ClassManagerService();
document.addEventListener('DOMContentLoaded', () => {
    const instance = ClassManagerService.instance;
    //debug
    console.log(instance);
    // instance.onPageInit();
    // instance.update();
});

EventSystem.on(EventType.pluginLoaded, () => {
    const instance = ClassManagerService.instance;
    instance.onPageInit();
    instance.update();
});


// ClassManager 是一个抽象类， 用于管理 class 对应的 items, 他提供下列功能：
// 1. 监听 对象的创建和销毁， 将 items 托管在管理器中
// 2. 提供一个 update 方法， 用于 执行 class 对应的 更新方法
// 3. 提供一个 onPageInit 方法， 用于执行 页面初始化方法

class ClassManager {
    items = [];
    classType = '';
    classManagerService = ClassManagerService.instance;

    disableOnSleep = true;

    constructor(classType) {
        this.classType = classType;
        this.classManagerService = ClassManagerService.instance;
        this.classManagerService.add(this);
    }

    init = (element) => {//debug
        console.log(`init ${element}`);
    }

    destroy = (element) => {//debug
        console.log(`destroy ${element}`);
    }

    onUpdate = () => { return; }

    onPageInit = () => { return; }

    needRefresh = false;
    refresh() {
        // 重新扫描 items
        const newItems = document.querySelectorAll(`.${this.classType}`);
        let removeItems = [];
        let addItems = [];
        this.items.forEach((item) => {
            if (!item.classList.contains(this.classType)) {
                removeItems.push(item);
                return;
            }
        });
        //debug
        newItems.forEach((item) => {
            if (!this.items.includes(item)) {
                addItems.push(item);
            }
        });

        if (removeItems.length > 0) {
            this.items = this.items.filter((item) => !removeItems.includes(item));
            removeItems.forEach((item) => {
                this.destroy(item);
            });
        }

        if (addItems.length > 0) {
            this.items = this.items.concat(addItems);
            addItems.forEach((item) => {
                this.init(item);
            });
        }
    }

    hasBuild = false;
    build(){
        this.hasBuild = true;
    }
}


export { ClassManager, ClassManagerService }





// 因为 js 必须要 导入之后才能 被执行， 所以这里需要导入使用了 ClassManager 的文件
