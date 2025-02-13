<template>
  <!-- -帮助页面 -->
  <div id="help-section">
    <leftMenu :tabs="tabs" :translatedTabs="translatedTabs" @tabChange="handleTabChange">
    </leftMenu>
    <div class="help-content OO-box">
      <!--  中文帮助页面 -->
      <div id="help-dialog-cn" v-if="language === 'zh_cn'" class="OO-scorll-box"
        style="display: flex;flex-direction: column;width: 100%;height: 100%;overflow-y: auto;overflow-x: hidden;">
        <!-- 根据选择的设置选项展示不同的设置内容 -->
        <!-- -名词解释 -->
        <Markdown :content="explainContentCn" v-if="currentTab === 'help-explain'"></Markdown>
        <!-- -导入mod -->
        <Markdown :content="importContentCn" v-if="currentTab === 'help-import'"></Markdown>
        <!-- -加载mod -->
        <Markdown :content="loadContentCn" v-if="currentTab === 'help-load'"></Markdown>
        <!-- -配置mod -->
        <Markdown :content="configContentCn" v-if="currentTab === 'help-config'"></Markdown>
        <!-- -预设 -->
        <Markdown :content="presetContentCn" v-if="currentTab === 'help-preset'"></Markdown>
        <!-- -自动化 -->
        <Markdown :content="autoContentCn" v-if="currentTab === 'help-auto'"></Markdown>
        <!-- -多个游戏 -->
        <Markdown :content="multipleGamesContentCn" v-if="currentTab === 'help-multiple-games'"></Markdown>
        <!-- -故障排除 -->
        <div v-if="currentTab === 'help-trouble'">
          <Markdown :content="troubleContentCn">
            <div class="OO-setting-bar" style="height: 50px !important;">
              <h3> QQ群 </h3>
              <p> 877012859 </p>
            </div>
            <div class="OO-setting-bar">
              <h3> Discord </h3>
              <s-button class="OO-button-box" @click="iManager.openUrl('https://discord.gg/4RbjKJuVKS')">
                join Discord
              </s-button>
            </div>
          </Markdown>
        </div>
        <!-- -配置mod加载器 -->
        <Markdown :content="configModLoaderContentCn" v-if="currentTab === 'help-config-mod-loader'"></Markdown>

        <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
      </div>

      <!-- -帮助页面，但是英文 -->
      <div id="help-dialog-en" v-else class="OO-scorll-box"
        style="display: flex;flex-direction: column;width: 100%;height: 100%;overflow-y: auto;overflow-x: hidden;">
        <!-- -Explain -->
        <Markdown :content="explainContentEn" v-if="currentTab === 'help-explain'"></Markdown>
        <!-- -Import Mods -->
        <Markdown :content="importContentEn" v-if="currentTab === 'help-import'"></Markdown>
        <!-- -Config Mod Loader -->
        <Markdown :content="configModLoaderContentEn" v-if="currentTab === 'help-config-mod-loader'"></Markdown>
        <!-- -Load Mods -->
        <Markdown :content="loadContentEn" v-if="currentTab === 'help-load'"></Markdown>
        <!-- -Mods Config -->
        <Markdown :content="configContentEn" v-if="currentTab === 'help-config'"></Markdown>
        <!-- -Presets -->
        <Markdown :content="presetContentEn" v-if="currentTab === 'help-preset'"></Markdown>
        <!-- -Automation -->
        <Markdown :content="autoContentEn" v-if="currentTab === 'help-auto'"></Markdown>
        <!-- -Multi-Game Support -->
        <Markdown :content="multipleGamesContentEn" v-if="currentTab === 'help-multiple-games'"></Markdown>
        <!-- -Troubleshooting -->
        <div v-if="currentTab === 'help-trouble'">
          <Markdown :content="troubleContentEn">
            <div class="OO-setting-bar" style="height: 50px !important;">
              <h3> QQ Group </h3>
              <p> 877012859 </p>
            </div>
            <div class="OO-setting-bar">
              <h3> Discord </h3>
              <s-button class="OO-button-box" @click="iManager.openUrl('https://discord.gg/4RbjKJuVKS')">
                join Discord
              </s-button>
            </div>
          </Markdown>
        </div>

        <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

import leftMenu from '../components/leftMenu.vue';
import Markdown from '../components/markdown.vue';
import { EventType,EventSystem } from '../../helper/EventSystem'; 

const explainContentCn =
  `# 先决条件
请确保你已经安装了3dmigoto 或者其他的mod加载器，并且已经成功运行过。如果你还没有安装3dmigoto，请先安装3dmigoto。如果你不明白3dmigoto是什么，请自行搜索。
请注意，本程序只是mod管理器，不是mod加载器，它需要依赖3dmigoto或者其他的mod加载器来加载mod

首先你需要理清楚这个程序是如何实现mod管理的：
它将你存放在 【mod 源文件夹】 的 mod 创建虚拟链接 到 【mod 目标文件夹】 中。
【mod加载器】 会读取 【mod 目标文件夹】 中的mod，然后加载到游戏中。
---
# 在使用之前，让我们进行一些名词解释
请注意，下述三个文件夹不能相同，否则会导致程序无法正常运行
如果你还是无法理解，可以先将其设置为空的文件夹，观察程序的运行效果，然后再进行设置。
# mod 目标文件夹
这是你的 模组加载器 实际加载的文件夹：
- 对于ZZMI来说，就是ZZMI的Mods文件夹；
- 对于XXMI来说，就是XXMI内部文件夹/zzz/Mods
本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载， 所以请不要在mod目标文件夹内添加任何文件！将你的mod添加到mod源文件夹中即可。
# mod 源文件夹
这是 本程序 读取mod的文件夹，也是你应当用来存放mod的文件夹。它应该被设置为任意位置的一个空文件夹，之后你需要将你的mod添加到这个文件夹中
# 预设文件夹
这是 本程序 用于存放mod预设的文件夹，程序将在这里存放一组mod的配置，在配置之后，你将通过预设功能快速切换不同的mod组合。它应该被设置为任意位置的一个空文件夹
# 关于本程序
# 运行原理
本程序通过代理Mods文件夹的方式来实现mod的加载，通过动态调整mod文件夹内部的文件来实现mod的加载。
  <img src="../src/assets/description.png" alt="description" style="width: 50%;height: auto;">
`;

const importContentCn =
  `# 导入mod
程序有三种方式导入mod：
1. 将mod文件夹添加到 mod源文件夹 中，程序会从源文件夹中读取mod文件夹。
2. 将解压了的mod文件夹 拖拽到程序中，程序会自动将mod文件夹添加到 mod源文件夹 中。
3. 将 无密码的zip 压缩文件 拖拽到程序中，程序会自动解压并将mod文件夹添加到 mod源文件夹 中。

所有的方式本质上都是将mod文件夹添加到 mod源文件夹 中，你需要先配置好 mod源文件夹 的路径。
# 导入后的现象
1. 通过直接将mod添加到 mod源文件夹 中，需要刷新程序之后才能看到新的mod以卡片的形式展示在mod列表中。
2. 通过拖拽解压后的mod文件夹或者无密码的zip文件，程序会自动刷新，并且会打开mod编辑页面，你可以在这里对mod的信息进行编辑，更多信息请查看【配置mod】。
---
# 可能遇到的问题
# 将mod文件夹添加到mod源文件夹中，但是mod列表中没有显示
1. 请检查mod源文件夹的路径是否正确。
2. 请检查mod源文件夹中是否有mod文件夹。
3. 请尝试重新打开程序
如果以上方法都无法解决问题，请转到【故障排除】。
# 拖拽压缩包后，程序弹出警告
1. 请检查压缩包是否有密码。
2. 请检查压缩包是否为zip格式。
程序目前只支持无密码的zip格式压缩包，这也是最常见的mod压缩格式，如果你的mod是其他格式，请先解压后再导入。
`;
const configModLoaderContentCn =
  `# 加载mod
本程序只是一个mod管理器，你需要另外下载一个游戏加载器来加载mod。它可以是3dmigoto、zzmi、xxmi等，下面我会介绍如何将本程序和常见加载器配合使用。
# 3dmigoto类
这些是未经封装的mod加载器，是我最推荐使用的mod加载器。它们的优点是：最基本也最不会出问题、响应迅速且无任何额外的功能。

你也可以寻找已经为各个游戏定制好的3dmigoto mod加载器，比如说：
-
[ZZMI - Zenless Zone Zero Model Importer GitHub](https://github.com/leotorrez/ZZ-Model-Importer)
[SRMI - Honkai: Star Rail Model Importer GitHub](https://github.com/SilentNightSound/SR-Model-Importer)
[GIMI - Genshin Impact Model Importer GitHub](https://github.com/SilentNightSound/GI-Model-Importer)
[WWMI - Wuthering Waves Model Importer GitHub](https://github.com/SpectrumQT/WWMI)
等等
-

使用本程序配合这些mod加载器，你只需要将 mod来源文件夹 设置为 mod加载器的 Mods 文件夹即可。
如果你还想要使用 【自动打开游戏和mod加载器】 功能，你需要将mod加载器的exe文件路径设置为mod加载器路径。
---
# XXMI
XXMI 本质上是一个拥有用户界面的 经过封装的 3dmigoto mod加载器。它的优点是：拥有用户界面，可以在多个游戏之间切换。

想要 使用本程序配合 XXMI，你需要将 mod来源文件夹 设置为 XXMI 说明的 存放mod的文件夹。如果你还想要拥有更便捷的使用体验，建议：
1. 将 XXMI 【启动游戏的exe文件路径】 设置为 【本程序的路径】。
2. 启用本程序的 【自动打开游戏和mod加载器】 的 自动打开游戏部分，并且设置【启动游戏的exe文件路径】为【实际游戏的exe文件路径】。

这样，当你在XXMI中点击开始游戏时，XXMI会启动 mod加载器和本程序，之后再由本程序启动游戏。此时XXMI的mod加载器能够正常加载mod，且本程序能够 动态控制mod的启用/禁用 以及 在游戏内刷新mod。

`;

const loadContentCn =
  `# 在配置mod加载器之后
首先你需要确保你正确指定了【mod源文件夹】以及【mod目标文件夹】的路径。
如果你不确定这两个文件夹的作用，请查看【名词解释】。
请注意，建议备份你的mod，以防你的误操作导致mod丢失。
# 一步步来，不要问为什么
1. 确保你已经正确配置了【mod源文件夹】以及【mod目标文件夹】的路径。
2. 你的【mod源文件夹】中有你添加的几个mod，它们以文件夹的形式存在。
3. 你的【mod目标文件夹】中没有任何文件，它应该是一个空文件夹。
4. 你能够在【mod列表】中看到你的mod卡片。
如果你发现以上步骤中有任何问题，请查看【故障排除】。
# 如果上面没有问题，那么
1. 左键点击【mod列表】中的任意一个mod卡片，你会发现伴随着动画，卡片会拥有一个高亮的边框。这意味该mod被设定为选中状态。
2. 你可以多点击几个mod卡片，它们会被添加到选中状态。
3. 点击 【模组】页面下的【应用】按钮，程序会将选中的mod创建虚拟链接到【mod目标文件夹】中。
4. 打开【mod目标文件夹】，你会发现该文件夹中出现了你选中的mod的虚拟链接。

如果你成功完成了以上步骤，那么恭喜你，你已经成功加载了mod。
之后 mod加载器 会读取【mod目标文件夹】中的mod，然后加载到游戏中。
`;
const configContentCn =
  `# mod的信息
mod 在【mod列表】中以卡片的形式展示，我们希望能够为其添加更多的信息，以便于我们更好的管理mod。
程序为每个mod添加了以下信息：
1. 角色（程序用于筛选mod的标签，它不一定是角色，也可以是其他的标签）
2. 快捷键
3. 说明
4. 预览图
# 编辑mod信息
1. 左键点击【mod列表】中的mod卡片后，在右侧的详细信息栏的下方，你会看到一个【编辑】按钮。点击它，会弹出mod的信息编辑窗口。
2. 右键点击【mod列表】中的mod卡片后，将会直接弹出mod的信息编辑窗口。
# 更改mod的预览图
除了在mod信息编辑窗口中可以点击【mod预览图】右侧的 + 号来更改mod的预览图外，你还可以直接将图片拖拽到mod卡片上来更改mod的预览图。
1. 将本地图片拖拽到【mod列表】中的mod卡片上，即可更改mod的预览图。
2. 将浏览器页面中的图片拖拽到【mod列表】中的mod卡片上，即可更改mod的预览图。

我非常推荐使用从浏览器中拖拽图片的方式来更改mod的预览图，因为这样可以直接使用 mod 网站上提供的预览图。
`;
const presetContentCn =
  `# 预设的功能
程序提供了预设的功能，你可以通过预设来快速的切换一组mod的启用/禁用状态。

在【模组】页面的左侧，你可以看到预设选择列表。你可以通过点击预设选择列表中的预设来切换预设。
一开始，程序应该会拥有一个default预设。
# 添加预设
1. 点击【模组】页面的左侧预设列表右下方的 “+” 添加预设按钮，会弹出一个新建预设的窗口。
2. 在新建预设的窗口中，输入预设的名称，然后点击【确定】。
3. 你会发现预设列表中多了一个新的预设。
# 删除预设
1. 点击【模组】页面的左侧预设列表右下方的 “三” 管理预设按钮，会弹出预设存放的文件夹。
2. 之后你可以删除预设文件夹中的预设文件来删除预设。
---
# default预设
default预设是程序自带的预设，你不能删除它，它也不会记录任何mod的启用/禁用状态。
切换到default预设时，程序会将所有mod切换至禁用状态。
如果你希望保存当前的mod启用/禁用状态，请新建一个预设。

当你想要测试单个mod，或者排除某个mod对游戏的影响时，它将会是你的好帮手。
`;
const autoContentCn =
  `# 自动化
“每次启动游戏都要打开mod加载器和本程序，然后再启动游戏，这样太麻烦了！”
“更改mod后还需要手动刷新mod加载器，这也太麻烦了！”
“我希望能够一键启动游戏和mod加载器！”
“我希望能够在游戏内刷新mod！”

如果你有以上的烦恼，那么你可以尝试使用程序的自动化功能。它目前作为插件的形式存在，你可以在【设置】页面中找到它。
---
---
# 配置自动启动
1. 打开【设置】页面。
2. 找到【自动启动插件】的配置项。
3. 按照提示设置插件的路径。
4. 点击【启动mod加载器】和【启动游戏】的按钮，测试能否正常启动mod加载器和游戏。

如果配置正确，那么在你每次打开本程序时，程序会自动启动mod加载器和游戏。
# 配置自动刷新
1. 打开【设置】页面。
2. 找到【游戏内刷新】的配置项。
3. 打开【应用后刷新】的开关。
4. 按照提示配置【进程名】和【刷新的虚拟键值】。

1. 进程名是你的游戏的进程名，你可以通过任务管理器来查看。对于Zenless Zone Zero来说，进程名是“ZenlessZoneZero.exe”。
2. 刷新的虚拟键值是你的 mod加载器用于刷新mod的按键的 快捷键 的虚拟键值。你可以通过上网搜索“虚拟键值对照表”来查找你的mod加载器的刷新快捷键的虚拟键值。一般来说，刷新的快捷键是F10，对应的虚拟键值是121。

`;
const multipleGamesContentCn =
  `# 适配多个游戏
通过使用 本地配置 而非 全局配置的方式，允许你创建多组配置，分别为不同的游戏设置mod加载器、mod源文件夹、mod目标文件夹等。

# 创建本地配置
1. 打开【设置】页面。
2. 找到【切换配置】的分页。
3. 选择【配置另存为】的路径，它应该是一个空的文件夹，之后点击创建快捷方式。

之后，当你通过创建在桌面的快捷方式打开程序时，程序会加载你选择的本地配置，而不是全局配置。

# 进阶用法
如果你知道基础的命令行知识，使用本地配置实际上是在XXMM启动时提供了启动参数：

'xx mod manager.exe' --customConfig '你的本地配置文件夹路径'

你可以尝试使用bat或者其他程序通过设置启动参数来启动程序，从而在别的应用中实现自动化。
`;

const troubleContentCn =
  `# 故障排除
当你遇到问题时，你可以尝试以下方法来解决问题：
1. 重新打开程序
2. 查阅【帮助】页面
3. 检查是否是mod加载器的问题，尝试单独启动mod加载器并复制mod到mod加载器的Mods文件夹中

如果你了解一些前端开发，你可以尝试按下Ctrl+Shift+I来打开开发者工具，查看是否有报错信息。
如果你无法解决问题，请联系我。
`;
;

const explainContentEn =
  `# Prerequisites
Please make sure you have 3dmigoto or other mod loader installed and running successfully. \nIf you haven't installed 3dmigoto yet, please install 3dmigoto first. \nIf you don't understand what 3dmigoto is, please search it yourself.
Please note that this program is only a mod manager, not a mod loader. It needs to rely on 3dmigoto or other mod loaders to load mods.

First, you need to understand how this program manages mods:
It creates virtual links from the mods stored in the [mod source folder] to the [mod target folder].
The [mod loader] reads the mods in the [mod target folder] and loads them into the game.
---
# Before using it, let us explain some terms
Please note that the following three folders cannot be the same, otherwise the program will not run properly.
If you still don't understand, you can set it to an empty folder first, observe the program's operation, and then set it up.
# Mod Target Folder
This is the folder actually loaded by your module loader. For ZZMI, it is the ZZMI Mods folder; for XXMI, it is the XXMI internal folder /zzz/Mods.
This program implements mod loading by proxying the Mods folder, and dynamically adjusts the files inside the mod folder to implement mod loading, so please do not add any files in the mod target folder! \nJust add your mod to the mod source folder.
# Source Folder
This is the folder where this program reads mods, and the folder where you should store mods. \nIt should be set to an empty folder anywhere, you will then need to add your mod to this folder
# Preset Folder
This is the folder used by this program to store mod presets. The program will store a set of mod configurations here. After the configuration, you will quickly switch between different mod combinations through the preset function. \nIt should be set to an empty folder anywhere
# About this program
# Operating principle
This program implements mod loading by proxying the Mods folder, and dynamically adjusts the files inside the mod folder to implement mod loading.
  <img src="../src/assets/description.png" alt="description" style="width: 50%;height: auto;">
`;

const importContentEn =
  `# Import Mods
There are three ways to import mods:
1. Add the mod folder to the mod source folder, and the program will read the mod folder from the source folder.
2. Drag the unzipped mod folder into the program, and the program will automatically add the mod folder to the mod source folder.
3. Drag a zip file without a password into the program, and the program will automatically unzip and add the mod folder to the mod source folder.

All methods essentially add the mod folder to the mod source folder, so you need to configure the path of the mod source folder first.
# After Importing
1. By directly adding mods to the mod source folder, you need to refresh the program to see the new mods displayed as cards in the mod list.
2. By dragging the unzipped mod folder or zip file, the program will automatically refresh and open the mod editing page, where you can edit the mod information. For more information, please refer to [Mods Config].
---
# Possible Issues
# Adding mod folder to mod source folder, but not showing in mod list
1. Check if the path of the mod source folder is correct.
2. Check if there are mod folders in the mod source folder.
3. Try reopening the program.
If the above methods do not solve the problem, please refer to [Troubleshooting].
# Warning after dragging zip file
1. Check if the zip file has a password.
2. Check if the zip file is in zip format.
The program currently only supports zip files without passwords, which is the most common mod compression format. If your mod is in another format, please unzip it first before importing.
`;

const configModLoaderContentEn =
  `# Loading Mods
This program is just a mod manager, you need to download a game loader to load mods. It can be 3dmigoto, zzmi, xxmi, etc. Below I will introduce how to use this program with common loaders.
# 3dmigoto Type
These are unwrapped mod loaders, which I highly recommend. Their advantages are: basic, least problematic, responsive, and no additional features.

You can also find 3dmigoto mod loaders customized for various games, such as:
-
[ZZMI - Zenless Zone Zero Model Importer GitHub](https://github.com/leotorrez/ZZ-Model-Importer)
[SRMI - Honkai: Star Rail Model Importer GitHub](https://github.com/SilentNightSound/SR-Model-Importer)
[GIMI - Genshin Impact Model Importer GitHub](https://github.com/SilentNightSound/GI-Model-Importer)
[WWMI - Wuthering Waves Model Importer GitHub](https://github.com/SpectrumQT/WWMI)
etc.
-

To use this program with these mod loaders, you only need to set the mod source folder to the Mods folder of the mod loader.
If you want to use the [Auto Open Game and Mod Loader] feature, you need to set the path of the mod loader's exe file to the mod loader path.
---
# XXMI
XXMI is essentially a 3dmigoto mod loader with a user interface. Its advantage is: it has a user interface and can switch between Multi-Game Support.

To use this program with XXMI, you need to set the mod source folder to the folder specified by XXMI for storing mods. If you want a more convenient experience, it is recommended to:
1. Set the [Path to the game's exe file] in XXMI to the path of this program.
2. Enable the [Auto Open Game and Mod Loader] feature of this program and set the [Path to the game's exe file] to the actual game's exe file path.

This way, when you click start game in XXMI, XXMI will start the mod loader and this program, and then this program will start the game. At this time, XXMI's mod loader can load mods normally, and this program can dynamically control the enable/disable of mods and refresh mods in the game.
`;

const loadContentEn =
  `# After Configuring the Mod Loader
First, you need to ensure that you have correctly specified the paths of the [mod source folder] and [mod target folder].
If you are not sure about the functions of these two folders, please refer to [Explain].
Please note that it is recommended to back up your mods to prevent loss due to misoperation.
# Step by Step, Don't Ask Why
1. Ensure that you have correctly configured the paths of the [mod source folder] and [mod target folder].
2. There are several mods in your [mod source folder], which exist as folders.
3. There are no files in your [mod target folder], it should be an empty folder.
4. You can see your mod cards in the [mod list].
If you find any problems in the above steps, please refer to [Troubleshooting].
# If There Are No Problems Above, Then
1. Left-click any mod card in the [mod list], you will find that the card will have a highlighted border with animation. This means the mod is set to the selected state.
2. You can click several mod cards, they will be added to the selected state.
3. Click the [Apply] button under the [Mods] page, the program will create virtual links for the selected mods to the [mod target folder].
4. Open the [mod target folder], you will find that the folder contains virtual links to the selected mods.

If you successfully complete the above steps, congratulations, you have successfully loaded the mods.
Then the mod loader will read the mods in the [mod target folder] and load them into the game.
`;

const configContentEn =
  `# Mod Information
Mods are displayed as cards in the [mod list], and we hope to add more information to them for better management.
The program adds the following information to each mod:
1. Character (a tag used by the program to filter mods, it may not necessarily be a character, it can be other tags)
2. Shortcut key
3. Description
4. Preview image
# Edit Mod Information
1. After left-clicking the mod card in the [mod list], you will see an [Edit] button at the bottom of the detailed information bar on the right. Click it to pop up the mod information editing window.
2. Right-clicking the mod card in the [mod list] will directly pop up the mod information editing window.
# Change Mod Preview Image
In addition to clicking the + sign on the right side of the [mod preview image] in the mod information editing window to change the mod preview image, you can also directly drag the image to the mod card to change the mod preview image.
1. Drag a local image to the mod card in the [mod list] to change the mod preview image.
2. Drag an image from the browser page to the mod card in the [mod list] to change the mod preview image.

I highly recommend using the method of dragging images from the browser to change the mod preview image, as this allows you to directly use the preview images provided on the mod website.
`;

const presetContentEn =
  `# Preset Function
The program provides a preset function, which allows you to quickly switch the enable/disable status of a group of mods.

On the left side of the [Mods] page, you can see the preset selection list. You can switch presets by clicking the presets in the preset selection list.
At the beginning, the program should have a default preset.
# Add Preset
1. Click the "+" add preset button at the bottom right of the preset list on the left side of the [Mods] page, a new preset window will pop up.
2. In the new preset window, enter the name of the preset, and then click [OK].
3. You will find a new preset in the preset list.
# Delete Preset
1. Click the "three" manage preset button at the bottom right of the preset list on the left side of the [Mods] page, the folder where the presets are stored will pop up.
2. Then you can delete the preset files in the preset folder to delete the presets.
---
# Default Preset
The default preset is a preset that comes with the program, you cannot delete it, and it will not record the enable/disable status of any mods.
When switching to the default preset, the program will switch all mods to the disabled state.
If you want to save the current mod enable/disable status, please create a new preset.

When you want to test a single mod or exclude the impact of a mod on the game, it will be your good helper.
`;

const autoContentEn =
  `# Automation
"Every time I start the game, I have to open the mod loader and this program, and then start the game. This is too troublesome!"
"After changing the mod, I still need to manually refresh the mod loader. This is too troublesome!"
"I want to start the game and mod loader with one click!"
"I want to refresh the mod in the game!"

If you have the above troubles, you can try using the automation function of the program. It currently exists as a plugin, and you can find it on the [Settings] page.
---
# Configure Auto Start
1. Open the [Settings] page.
2. Find the configuration item of the [Auto Start Plugin].
3. Set the path of the plugin according to the prompt.
4. Click the [Start Mod Loader] and [Start Game] buttons to test whether the mod loader and game can be started normally.

If configured correctly, the program will automatically start the mod loader and game every time you open this program.
# Configure Auto Refresh
1. Open the [Settings] page.
2. Find the configuration item of [In-Game Refresh].
3. Turn on the [Refresh After Applying] switch.
4. Configure the [Process Name] and [Virtual Key Value for Refresh] according to the prompt.

1. The process name is the process name of your game, which you can view through the task manager. For Zenless Zone Zero, the process name is "ZenlessZoneZero.exe".
2. The virtual key value for refresh is the virtual key value of the shortcut key used by your mod loader to refresh mods. You can search online for the "virtual key value table" to find the virtual key value of the refresh shortcut key of your mod loader. Generally, the refresh shortcut key is F10, and the corresponding virtual key value is 121.
`;

const multipleGamesContentEn =
  `# Multi-Game Support
By using local configuration instead of global configuration, you can create multiple configurations for different games to set mod loaders, mod source folders, mod target folders, etc.

# Create Local Configuration
1. Open the [Settings] page.
2. Find the [Switch Configuration] page.
3. Select the path of [Save As], it should be an empty folder, and then click Create Shortcut.

After that, when you open the program by creating a shortcut on the desktop, the program will load the local configuration you selected, instead of the global configuration.

# Advanced Usage
If you know basic command line knowledge, using local configuration is actually providing startup parameters when XXMM starts:

'xx mod manager.exe' --customConfig 'path to your local configuration folder'

You can try using bat or other programs to start the program by setting startup parameters, so as to achieve automation in other applications.
`;

const troubleContentEn =
  `# Troubleshooting
When you encounter problems, you can try the following methods to solve them:
1. Reopen the program
2. Refer to the [Help] page
3. Check if it is a problem with the mod loader, try starting the mod loader separately and copying the mod to the mod loader's Mods folder

If you know some front-end development, you can try pressing Ctrl+Shift+I to open the developer tools and check for error messages.
If you cannot solve the problem, please contact me.
`;


const language = ref('en');

// 重新编排tab内容和顺序
// 1. 名词解释
// 2. 导入mod
// 3. 配置mod加载器
// 4. 加载mod
// 5. 配置mod
// 6. 预设
// 7. 自动化
// 8. 适配多个游戏
// 9. 故障排除
const tabs = ['help-explain', 'help-import', 'help-config-mod-loader', 'help-load', 'help-config', 'help-preset', 'help-auto', 'help-multiple-games', 'help-trouble'];

const currentTab = ref(tabs[0]);
const handleTabChange = (tab) => {
  currentTab.value = tab;
};

const translatedTabs = ref(['Overview', 'Importing Mods', 'Loader Config', 'Load Mods', 'Mods Config', 'Presets', 'Automation', 'Multi-Game Support', 'Troubleshooting']);
const setTranslatedTabs = (language) =>{
  if (language === 'zh_cn') {
    translatedTabs.value = ['名词解释', '导入mod', '配置mod加载器', '加载mod', '配置mod', '预设', '自动化', '适配多个游戏', '故障排除'];
  } else {
    translatedTabs.value = ['Overview', 'Importing Mods', 'Loader Config', 'Load Mods', 'Mods Config', 'Presets', 'Automation', 'Multi-Game Support', 'Troubleshooting'];
  }
}

onMounted(() => {
  EventSystem.on(EventType.languageChange, (lang) => {
    //debug 
    console.log('helpSection languageChange', lang);
    language.value = lang;
    setTranslatedTabs(lang);
});
});

</script>

<style scoped>
#help-section {
  display: flex;
  flex-direction: row;
  height: calc(100% - 60px);
  width: 100%;
  overflow: display;
}

.help-content {
  margin: 0 10px;
  height: calc(100% - 20px);
  /* width: calc(100% - 200px); */
  flex: 1;

  >div {
    padding-right: 10px;
  }
}
</style>