<template>
    <div class="setting-container">
        <leftMenu :tabs="tabs" :translatedTabs="translatedTabs" @tabChange="handleTabChange">
        </leftMenu>

        <div class="setting-content OO-box">
            <!-- -=========== 常规设置 =========== -->
            <div v-if="currentTab === 'normal'">

                <div class="OO-setting-bar" id="setting-get-language">
                    <h3 data-translate-key="language"> {{ $t('setting.language') }} </h3>
                    <div id="language-picker">
                        <input type="radio" name="language" id="zh_cn" checked value="zh_cn" v-model="language">
                        <label for="zh_cn">
                            <s-chip selectable="true" type="default" id="zh_cn">
                                <p>简体中文</p>
                            </s-chip>
                        </label>
                        <input type="radio" name="language" id="en" value="en" v-model="language">
                        <label for="en">
                            <s-chip selectable="true" type="default" id="en">
                                <p>English</p>
                            </s-chip>
                        </label>
                    </div>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar" id="setting-get-theme">
                    <h3 data-translate-key="theme"> {{ $t('setting.theme') + ": " + theme }} </h3>
                    <div id="theme-picker">
                        <input type="radio" name="theme" id="auto" checked value="auto" v-model="theme">
                        <label for="auto"> <s-chip selectable="true" type="default" id="auto">
                                <p data-translate-key="auto"> {{ $t('setting.auto') }} </p>
                            </s-chip> </label>
                        <input type="radio" name="theme" id="dark" value="dark" v-model="theme">
                        <label for="dark"> <s-chip selectable="true" type="default" id="dark">
                                <p data-translate-key="dark"> {{ $t('setting.dark') }} </p>
                            </s-chip> </label>
                        <input type="radio" name="theme" id="light" value="light" v-model="theme">
                        <label for="light"> <s-chip selectable="true" type="default" id="light">
                                <p data-translate-key="light"> {{ $t('setting.light') }} </p>
                            </s-chip> </label>
                    </div>
                </div>
                <s-divider></s-divider>
                <h3>
                    {{ $t('setting.unavailable') }}
                </h3>
                <div id="auto-apply" class="OO-setting-bar">
                    <h3 data-translate-key="auto-apply"> 自动应用 </h3>
                    <s-switch id="auto-apply-switch"></s-switch>
                </div>
                <p data-translate-key="auto-apply-info">当选择/取消选择mod时自动应用配置(可能带来轻微卡顿)</p>
                <div id="auto-refresh-function" class="OO-setting-bar">
                    <h3 data-translate-key="auto-refresh-in-zzz"> 自动刷新 </h3>
                    <s-switch id="auto-refresh-in-zzz" data-platform="win32"></s-switch>
                </div>
                <p data-translate-key="auto-refresh-in-zzz-info">启用 应用mod时 将会自动在绝区零中激活刷新</p>
                <s-divider></s-divider>

                <!-- 启动程序的时候也一并启动游戏和modLoader -->
                <div id="auto-start-game" class="OO-setting-bar">
                    <h3 data-translate-key="auto-start-game"> 自动启动游戏 </h3>
                    <s-switch id="auto-start-game-switch"></s-switch>
                </div>
                <p data-translate-key="auto-start-game-info">启动程序的时候也一并启动游戏和modLoader(需要在进阶设置设置游戏目录和modLoader目录)</p>
                <s-divider></s-divider>
                <div id="use-admin" class="OO-setting-bar">
                    <h3 data-translate-key="use-admin"> 使用管理员权限 </h3>
                    <s-switch id="use-admin-switch" data-platform="win32"></s-switch>
                </div>
                <p data-translate-key="use-admin-info">启动程序时是否使用管理员权限(需要重启程序生效)</p>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -高级设置 -->
            <!-- -在这里可以设定 modRootDir，modSourceDir，modLoaderDir，gameDir -->
            <div v-if="currentTab === 'advanced'">
                <div class="OO-setting-bar">
                    <h3 data-translate-key="modTargetPath"> {{ $t('setting.modTargetPath') }} </h3>
                    <div class="OO-s-text-field-container">
                        <s-text-field :value="modTargetPath" @input="modTargetPath = $event.target.value">
                        </s-text-field>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            @click="iManager.setConfigFromDialog('modTargetPath', 'directory').then((res) => { modTargetPath = res })">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div>

                </div>
                <p> {{ $t('setting.modTargetPath-info') }} <br>当前目录为: {{
                    modTargetPath }}</p>

                <s-divider></s-divider>

                <div class="OO-setting-bar">
                    <h3 data-translate-key="modSourcePath"> {{ $t('setting.modSourcePath') }} </h3>
                    <div class="OO-s-text-field-container">
                        <s-text-field :value="modSourcePath" @input="modSourcePath = $event.target.value">
                        </s-text-field>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            @click="iManager.setConfigFromDialog('modSourcePath', 'directory').then((res) => { modSourcePath = res })">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div>
                </div>
                <p data-translate-key="modSourcePath-info"> {{ $t('setting.modSourcePath-info') }}
                    <br>当前目录为: {{ modSourcePath }}
                </p>

                <s-divider></s-divider>

                <div class="OO-setting-bar">
                    <h3> {{ $t('setting.presetPath') }} </h3>
                    <div class="OO-s-text-field-container">
                        <s-text-field :value="presetPath" @input="presetPath = $event.target.value">
                        </s-text-field>
                        <s-icon-button type="filled" slot="start" class="OO-icon-button"
                            @click="iManager.setConfigFromDialog('presetPath', 'directory').then((res) => { presetPath = res })">
                            <s-icon type="add"></s-icon>
                        </s-icon-button>
                    </div>
                </div>
                <p data-translate-key="presetPath-info"> {{ $t('setting.presetPath-info') }} <br>当前目录为: {{
                    presetPath }}</p>

                <s-divider></s-divider>


                <h3>
                    {{ $t('setting.unavailable') }}
                </h3>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="modLoaderDir"> mod加载器目录 </h3>
                    <s-text-field>
                        <input type="text" id="set-modLoaderDir-input">
                    </s-text-field>
                </div>
                <p data-translate-key="modLoaderDir-info"> Mod加载器目录为modLoader程序的位置，用于在管理器中打开modLoader </p>
                <s-divider></s-divider>


                <div class="OO-setting-bar">
                    <h3 data-translate-key="gameDir"> 游戏目录 </h3>
                    <s-text-field>
                        <input type="text" id="set-gameDir-input">
                    </s-text-field>
                </div>
                <p data-translate-key="gameDir-info"> 游戏目录为游戏程序的位置，用于在管理器中打开游戏 </p>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="refresh-mod-info-swapkey"> 刷新mod信息中的快捷键 </h3>
                    <s-button id="refresh-mod-info-swapkey-button" data-translate-key="refresh">
                        刷新
                    </s-button>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar" id="settings-init-config">
                    <h3 data-translate-key="init-config"> 初始化配置 </h3>
                    <s-button id="init-config-button" data-translate-key="init">
                        初始化所有配置
                    </s-button>
                </div>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -切换配置 -->
            <!-- -在这里你可以选择开启在开始的时候选择配置文件的功能，并且设置配置文件保存位置 -->
            <div v-if="currentTab === 'switch-config'">
                <h3>
                    {{ $t('setting.unavailable') }}
                </h3>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="if-ask-switch-config"> 是否询问切换配置 </h3>
                    <s-switch id="if-ask-switch-config-switch"></s-switch>
                </div>
                <p data-translate-key="if-ask-switch-config-info">
                    启动程序时是否询问切换配置文件（需要先在下面指定文件夹），以在不同游戏中使用，否则将使用缓存中的配置文件</p>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="config-dir"> 配置文件夹 </h3>
                    <s-text-field>
                        <input type="text" id="set-configRootDir-input">
                    </s-text-field>
                </div>
                <p data-translate-key="config-dir-info">
                    配置文件夹为存储配置文件的位置，程序将在这里寻找配置文件，配置文件以文件夹形式存储，内部的config.json为配置文件
                </p>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="switch-config"> 切换配置 </h3>
                    <s-button id="switch-config-button" data-translate-key="switch"
                        onclick="document.getElementById('switch-config-dialog').show()">
                        切换配置
                    </s-button>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3 data-translate-key="save-config"> 保存配置 </h3>
                    <s-button id="save-config-button" data-translate-key="save">
                        保存配置
                    </s-button>
                </div>
                <p data-translate-key="save-config-info"> 保存当前配置到配置文件夹 </p>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>



            <!-- -about page -->
            <div v-if="currentTab === 'about'">
                <div class="OO-setting-bar" style="height: fit-content;">
                    <p data-translate-key="about-content"> 本程序由 XLXZ 开发,开源免费,遵循GNU General Public License
                        v3.0。用于管理基于3dmigoto的mod
                        ,理论上来说也可以管理其他游戏的mod(只要是基于3dmigoto的) </p>
                </div>
                <div class="OO-setting-bar">
                    <p data-translate-key="about-version"> 最新版本在gamebanana上发布，如果你有任何问题或者建议，欢迎在github上提出 </p>
                </div>
                <div class="OO-setting-bar">
                    <p data-translate-key="about-author"> 作者：XLXZ </p>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar" style="height: 100px;">
                    <h3 data-translate-key="about-thanks"> 感谢 soliddanii <br>提供的帮助 </h3>
                    <s-button class="link-button" type="text" link="https://github.com/soliddanii"
                        data-translate-key="click-to-jump"> 点击跳转 </s-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> Github </h3>
                    <s-button class="link-button" type="text"
                        link="https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto/"
                        data-translate-key="click-to-jump"> 点击跳转 </s-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> Gamebanana </h3>
                    <s-button class="link-button" type="text" link='https://gamebanana.com/tools/17889'
                        data-translate-key="click-to-jump"> 点击跳转 </s-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> Caimogu </h3>
                    <s-button class="link-button" type="text" link='https://www.caimogu.cc/post/1408504.html'
                        data-translate-key="click-to-jump"> 点击跳转 </s-button>
                </div>

                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>

            <!-- -插件管理面板，控制插件的开关 -->
            <div v-if="currentTab === 'plugin'">
                <div class="OO-setting-bar">
                    <h3> 插件管理 </h3>
                </div>
                <div class="OO-box OO-shade-box" style="margin: 10px 0;">
                    <h3> 插件列表 </h3>
                    <div class="OO-setting-bar" v-for="(pluginData, pluginName) in plugins" :key="pluginName">
                        <h3 v-if="pluginData.t_name">{{ pluginData.t_name[locale] }}</h3>
                        <h3 v-else>{{ pluginName }}</h3>
                        <!-- -如果iManager.disabledPluginNames 中包含 pluginName，则显示为 false，否则显示为 true -->
                        <s-switch :checked="!iManager.disabledPluginNames.includes(pluginName)"
                            @change="iManager.togglePlugin(pluginName)">
                        </s-switch>
                    </div>
                </div>


            </div>
            <!-- -这里后面提供 各个插件的设置 -->
            <div v-for="(pluginData, pluginName) in pluginConfig" :key="pluginName">
                <div v-if="currentTab === pluginName">

                    <s-fold folded="true">
                        <s-button slot="trigger">show details</s-button>
                        <div>
                            {{ pluginName }}
                        </div>
                        <s-divider></s-divider>
                        <div class="OO-box OO-shade-box">
                            <div v-for="data in pluginData" :key="data.name">
                                <div class="OO-setting-bar">
                                    <h3 v-if="data.t_name">{{ data.t_name[locale] }}</h3>
                                    <h3 v-else>{{ data.displayName }}</h3>
                                    <div>
                                        {{ data.data }}
                                    </div>
                                </div>
                                {{ data }}
                            </div>
                        </div>
                    </s-fold>

                    <s-divider></s-divider>
                    <div v-for="data in pluginData" :key="data.name">
                        <div class="OO-setting-bar">
                            <h3 v-if="data.t_name">{{ data.t_name[locale] }}</h3>
                            <h3 v-else>{{ data.displayName }}</h3>

                            <s-switch :checked="data.data" @change="data.onChange($event.target.checked)"
                                v-if="data.type === 'boolean'"></s-switch>
                            <div v-else-if="data.type === 'string'">
                                <s-text-field :value="data.data"
                                    @input="data.onChange($event.target.value)"></s-text-field>
                            </div>
                            <s-text-field :value="data.data" @input="data.onChange($event.target.value)"
                                v-else-if="data.type === 'number'"></s-text-field>
                            <div v-else-if="data.type === 'select'" style="display: flex;flex-direction:row;">
                                <div v-for="(option, index) in data.options" :key="index">
                                    <input type="radio" :name="data.name" :id="option.value" :value="option.value"
                                        v-model="data.data">
                                    <label :for="option.value">
                                        <s-chip selectable="true" type="default" :id="option.value"
                                            @click="data.onChange(option.value)">
                                            <p>{{ option.t_value ? option.t_value[locale] : option.value }}</p>
                                        </s-chip>
                                    </label>
                                </div>
                            </div>
                            <div v-else-if="data.type === 'path'" class="OO-s-text-field-container">
                                <s-text-field :value="data.data" @input="data.onChange($event.target.value)">
                                </s-text-field>
                                <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                    @click="iManager.getFilePath('modLoaderPath', 'exe').then((res) => { data.data = res, data.onChange(res) })">
                                    <s-icon type="add"></s-icon>
                                </s-icon-button>
                            </div>
                            <s-button @click="data.onChange()" v-else-if="data.type === 'button'">
                                {{ data.t_buttonName ? data.t_buttonName[locale] : data.buttonName }}
                            </s-button>
                        </div>
                        <div v-if="data.t_description">
                            <p> {{ data.t_description[locale] }} </p>
                        </div>
                        <div v-else>
                            <p> {{ data.description }} </p>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    </div>
</template>

<script setup>
import leftMenu from '../components/leftMenu.vue';
import chipButton from '../components/chipButton.vue';
import { computed, h, onMounted, ref, watch } from 'vue';
import IManager from '../../electron/IManager';
const iManager = new IManager();
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const tabs = ref(['normal', 'advanced', 'switch-config', 'about', 'plugin']);
const translatedTabs = computed(() => {
    const tTab = tabs.value.map((tab) => {
        // 如果 是 插件的 tab ，则尝试获取 plugin.t_name
        //console.log('trying to get plugin name', tab, iManager.plugins[tab],iManager.plugins);
        if (iManager.plugins[tab]) {
            //debug
            console.log('trying to get plugin name', tab, iManager.plugins[tab], locale.value);
            return iManager.plugins[tab].t_name[locale.value] || tab;
        }
        return t(`setting-tab.${tab}`)
    });
    //debug
    console.log('translatedTabs', tTab);
    return tTab;
});

const currentTab = ref('常规设置');

const handleTabChange = (tab) => {
    currentTab.value = tab;
    //debug
    console.log('handleTabChange', tab);
};

const language = ref('zh_cn');
const theme = ref('auto');
const modTargetPath = ref('');
const modSourcePath = ref('');
const presetPath = ref('');


watch(language, (newVal) => {
    // iManager.config.language = newVal;
    //变量命名不能包含-，所以这里需要转换
    console.log('language change', newVal);

    // // 通过 i18n 的 locale 来切换语言
    // locale.value = newVal;

    // 改为通过 iManager 来切换语言
    iManager.setLanguage(newVal);
    iManager.saveConfig();
});
watch(theme, (newVal) => {
    iManager.config.theme = newVal;
    //现在暂时是手动调用 事件 激活
    iManager.trigger('theme-change', newVal);

    iManager.saveConfig();
});
watch(modTargetPath, (newVal) => {
    iManager.config.modTargetPath = newVal;
    iManager.saveConfig();
});
watch(modSourcePath, (newVal) => {
    iManager.config.modSourcePath = newVal;
    iManager.saveConfig();
});
watch(presetPath, (newVal) => {
    iManager.config.presetPath = newVal;
    iManager.saveConfig();
});

const plugins = ref({});
const pluginConfig = ref({});
watch(pluginConfig, (newVal) => {
    //debug
    console.log('===pluginConfig changed:', newVal);
    iManager.pluginConfig = newVal;
    iManager.saveConfig();
});
onMounted(async () => {
    //debug
    console.log('settingSection mounted');
    await iManager.waitInit();
    //初始化语言
    language.value = iManager.config.language;
    //初始化主题
    theme.value = iManager.config.theme;
    //初始化modTargetPath
    modTargetPath.value = iManager.config.modTargetPath;
    //初始化modSourcePath
    modSourcePath.value = iManager.config.modSourcePath;
    //初始化presetPath
    presetPath.value = iManager.config.presetPath;
    //初始化tab
    currentTab.value = tabs.value[0];

    // 挂载插件的额外设置
    plugins.value = iManager.plugins;
    pluginConfig.value = iManager.pluginConfig;
    console.log('pluginConfig', pluginConfig);
    // pluginConfig 是 一组 plungeName:pluginData 的键值对
    // 每个 pluginData 是一个 数组，数组中的每个元素是一个data对象，data对象包含了插件的设置
    // 每个 data 对象包含了以下属性
    // data 的格式为
    // {
    //     name: 'ifAblePlugin',
    //     data: true,
    //     type: 'boolean',
    //     displayName: 'If Able Plugin',
    //     description: 'If true, the plugin will be enabled',
    //     t_name:{
    //         zh_cn:'是否启用插件',
    //         en:'Enable Plugin'
    //     },
    //     t_description:{
    //         zh_cn:'如果为真，插件将被启用',
    //         en:'If true, the plugin will be enabled'
    //     },
    //     onChange: (value) => {
    //         console.log('ifAblePlugin changed:', value);
    //     }
    // }
    // 通过这个数据，我们可以动态生成插件的设置界面

    // 为 plugin 添加 tab
    tabs.value.push(...Object.keys(pluginConfig.value));
    // 生成插件设置界面
    // 1. 生成插件的设置界面
    // 2. 生成插件的设置界面的数据

    // 遍历插件数据
    for (const pluginName in pluginConfig.value) {
        const plugin = pluginConfig.value[pluginName];
        // 遍历插件的设置
        for (const data of plugin) {
            // 生成设置界面
            // 生成设置界面的数据
            //debug
            console.log(`in plugin ${pluginName}, data:`, data);
        }
    }


});
</script>


<style scoped>
.setting-container {
    display: flex;
    height: calc(100% - 60px);
    width: 100%;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
    flex-wrap: nowrap;
}

.setting-content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: calc(100% - 200px);
    height: calc(100% - 20px);
    flex: 1;
    margin: 0 10px;
}

.setting-content>div {
    overflow-y: auto;
}
</style>