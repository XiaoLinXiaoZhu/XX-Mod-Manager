<template>
    <div class="setting-container">
        <leftMenu :tabs="tabs" :translatedTabs="translatedTabs" @tabChange="handleTabChange">
        </leftMenu>

        <div class="setting-content OO-box OO-scorll-box">
            <!-- -=========== 常规设置 =========== -->
            <div v-if="currentTab === 'normal'">
                <settingBar :data="languageData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="themeData"></settingBar>
                <s-divider></s-divider>

                <h3>
                    {{ $t('setting.movedToPlugin') }}
                </h3>

                <div class="OO-setting-bar">
                    <h3> 自动应用 </h3>
                    <s-switch disabled="true"></s-switch>
                </div>
                <p>当选择/取消选择mod时自动应用配置(可能带来轻微卡顿)</p>
                <div class="OO-setting-bar">
                    <h3> 自动刷新 </h3>
                    <s-switch data-platform="win32" disabled="true"></s-switch>
                </div>
                <p>启用 应用mod时 将会自动在绝区零中激活刷新</p>
                <s-divider></s-divider>

                <!-- 启动程序的时候也一并启动游戏和modLoader -->
                <div class="OO-setting-bar">
                    <h3> 自动启动游戏 </h3>
                    <s-switch disabled="true"></s-switch>
                </div>
                <p>启动程序的时候也一并启动游戏和modLoader(需要在进阶设置设置游戏目录和modLoader目录)</p>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3> 使用管理员权限 </h3>
                    <s-switch data-platform="win32" disabled="true"></s-switch>
                </div>
                <p>启动程序时是否使用管理员权限(需要重启程序生效)</p>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -高级设置 -->
            <!-- -在这里可以设定 modRootDir，modSourceDir，modLoaderDir，gameDir -->
            <div v-if="currentTab === 'advanced'">

                <settingBar :data="modTargetPathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="modSourcePathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="presetPathData"></settingBar>

                <s-divider></s-divider>
                <s-button @click="console.log(iManager.config)" data-translate-key="show-config">
                    显示配置
                </s-button>
                <s-divider></s-divider>
                <settingBar :data="initAllDataButton"></settingBar>

                <h3>
                    {{ $t('setting.unavailable') }}
                </h3>

                <div class="OO-setting-bar">
                    <h3 data-translate-key="refresh-mod-info-swapkey"> 刷新mod信息中的快捷键 </h3>
                    <s-button id="refresh-mod-info-swapkey-button" data-translate-key="refresh">
                        刷新
                    </s-button>
                </div>
                <s-divider></s-divider>

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
                        <h3 v-if="pluginData.t_displayName">{{ pluginData.t_displayName[locale] }}</h3>
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
                                    <h3 v-if="data.t_displayName">{{ data.t_displayName[locale] }}</h3>
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
                        <settingBar :data="data"></settingBar>
                    </div>
                </div>


            </div>
        </div>
    </div>
</template>

<script setup>
import leftMenu from '../components/leftMenu.vue';
import chipButton from '../components/chipButton.vue';
import settingBar from '../components/settingBar.vue';
import { computed, h, onMounted, ref, watch } from 'vue';
import IManager from '../../electron/IManager';
const iManager = new IManager();
import getData from './settingSectionData.js';
const {
    languageData,
    themeData,
    modTargetPathData,
    modSourcePathData,
    presetPathData,
    initAllDataButton
} = getData();

import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const tabs = ref(['normal', 'advanced', 'switch-config', 'about', 'plugin']);
const translatedTabs = computed(() => {
    const tTab = tabs.value.map((tab) => {
        // 如果 是 插件的 tab ，则尝试获取 plugin.t_displayName
        //console.log('trying to get plugin name', tab, iManager.plugins[tab],iManager.plugins);
        if (iManager.plugins[tab]) {
            //debug
            console.log('trying to get plugin name', tab, iManager.plugins[tab], locale.value);
            return iManager.plugins[tab].t_displayName[locale.value] || tab;
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
    //     t_displayName:{
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