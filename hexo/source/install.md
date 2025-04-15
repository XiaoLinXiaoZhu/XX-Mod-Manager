---
title: 下载、安装「XXMM」
description: 下载和安装永远是使用一款软件的第一步。
type: docs
lang: zh-CN
---

# 下载和安装**「XXMM」**

## 下载

你可以通过以下方式下载xxmm：
1. 在 [github release](https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager/releases) 页面下载最新版本的压缩包。
2. 在 caimogu 或者 gamebanana 等网站寻找我发布的最新版本。
3. 在社区平台（如 QQ 群、Discord 等）中寻找我发布的最新版本。

> 请注意，XXMM 是一个开源免费的程序，任何人都可以在 GitHub 上下载和使用它。但是禁止任何人将其打包成其他收费软件进行出售或传播。
> 如果你遇到有人出售 XXMM ，那么你就是被骗了，请尝试向其申请退款并举报。

如果您是windows平台，建议下载类似`XX-Mod-Manager-X.X.X-win.zip`的压缩包，解压后直接运行`XX-Mod-Manager.exe`即可。

如果您是linux平台，则需要下载`xx-mod-manager-X.X.X.tar.gz`的压缩包，解压后直接运行`XX-Mod-Manager`即可。

> 请注意，因为我并不在linux平台上开发和测试，所以可能会存在一些问题，如果你在使用过程中遇到问题，请尝试在社区平台（如 QQ 群、Discord 等）中寻求帮助。
> 如果你有能力修复这些问题，请提交 PR，我会非常感激的。


## 在 Windows 上安装

将程序包解压到一个合适的位置，我不推荐解压在 **C 盘根目录**和**桌面**上，也不推荐解压在其它需要特殊权限的目录下（比如 `C:\Program Files`）。

解压后的目录结构如下：

```
│  chrome_100_percent.pak
│  chrome_200_percent.pak
│  d3dcompiler_47.dll
│  ffmpeg.dll
│  icudtl.dat
│  libEGL.dll
│  libGLESv2.dll
│  LICENSE.electron.txt
│  LICENSES.chromium.html
│  resources.pak
│  snapshot_blob.bin
│  test.txt
│  v8_context_snapshot.bin
│  vk_swiftshader.dll
│  vk_swiftshader_icd.json
│  vulkan-1.dll
│  XX Mod Manager.exe
│  
├─locales
│      af.pak
│      ...这里是各个语言的翻译文件
│      
├─plugins
│      autoStartPlugin.js
│      changCharacterPlugin.js
│      deleteModPlugin.js
│      modCardEffectPlugin.js
│      pinWindowPlugin.js
│      recognizeModInfoPlugin.js
│      refreshAfterApplyPlugin.js
│      rememberModStatePlugin.js
│      testPlugin.js
│      
├─resources
│  │  请注意：这里是程序的资源文件夹，里面包含了程序运行所需的资源文件。
│  │  不要随意修改或删除这些文件，否则可能会导致程序无法正常运行。
│                      
└─src
    └─assets
            default.png // 你可以通过修改该图片来设置每个mod的默认显示的图片
```

> **注意：** 这里的 `XX Mod Manager.exe` 是程序的主执行文件，其他文件和文件夹都是程序运行所需的资源文件。
> **注意：** 不要改动任何文件和文件夹的名称，否则可能会导致程序无法运行。
> **注意：** plugins 文件夹是插件文件夹，里面包含了程序的所有插件，你可以在这里添加、删除或修改插件。想要让插件正常运行，你需要为xxmm设置正确的启动路径。


之后，双击 `XX Mod Manager.exe` 即可运行程序。

## 在 Linux 上安装

> 这个部分我不太熟悉，所以可能会有一些错误。下面的内容仅供参考。

1. 下载适合 Linux 平台的压缩包，例如 `xx-mod-manager-X.X.X.tar.gz`。
2. 打开终端，导航到下载的文件所在目录。
3. 解压压缩包：
   ```bash
   tar -xvzf xx-mod-manager-X.X.X.tar.gz
   ```
4. 进入解压后的目录：
   ```bash
   cd xx-mod-manager-X.X.X
   ```
5. 运行程序：
   ```bash
   ./XX-Mod-Manager
   ```

> **注意：** 如果出现权限不足的错误，请尝试为文件添加可执行权限：
> ```bash
> chmod +x XX-Mod-Manager
> ```

> **提示：** 如果您希望更方便地运行程序，可以将其添加到系统的 PATH 中，或者创建桌面快捷方式。

> **注意：** 由于开发环境的限制，Linux 版本可能存在一些兼容性问题。如果遇到问题，请在社区平台中寻求帮助，或者提交 Issue 到 [GitHub 仓库](https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager/issues)。


## 运行

双击 `XX Mod Manager.exe` 即可运行程序。**XXMM 不需要使用管理员身份运行**，也不推荐使用管理员身份运行。

使用管理员身份运行可能会导致一些功能无法正常使用，比如拖拽相关的文件操作。

正常第一次启动后，程序会打开一个初始化向导，帮助你完成一些必要的设置。

但是有的时候，程序可能会因为一些原因无法打开初始化向导，这时候你可以手动打开设置窗口，完成必要的设置，这并不会影响程序的正常使用。

> 如果你运行后，发现程序无法正常显示帮助和设置页面，那么请尝试运行以下命令，清空已有的所有配置，之后重新初始化。
> ```bash
> del %APPDATA%\XX-Mod-Manager\*.*
> ```

## 卸载

程序会在全局保存一份你的数据，用于更新时继承，要删除这些配置，你可以执行：

```
rm -rf %APPDATA%\XX-Mod-Manager
```

除此之外，程序不会在所在目录以外的任何地方创建文件，所以如果想要进行保留数据的卸载只需要删除程序所在目录即可。


## 升级

我暂时还没有做能够自动升级的系统。

当你需要升级新的版本的时候，直接删除旧版本，将新版本解压即可，因为程序会在全局保存一份你的数据，所以说无需担心你的数据迁移问题。

你也可以直接通过覆盖来进行更新，因为使用的时electron，所有的资源都在asar里面，被直接覆盖。


## 在安装之后

完成安装后，您还需要为其环境配置。

你可以按照第一次打开的时候弹出来的初始化向导进行操作，也可以直接按照本文档的介绍继续操作：

[环境配置](./config) 来了解详细步骤。

---

如果您在操作过程中遇到问题，可以随时查阅帮助页面或参考故障排除文档。
