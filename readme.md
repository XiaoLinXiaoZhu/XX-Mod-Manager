![](https://img520.com/4uig49.gif)
![](https://img520.com/er4NFf.gif)

# Mods Manager for 3dmigoto<br>--Plugin management tools for 3dmigoto

中文：[简体中文](readme-ch.md) | English: [English](readme.md)

## Target in next version:

1. Optimize Page Layout
2. [test function] Changing the toggle shortcut for the module (this is intrusive for mod and will potentially prevent mod from working properly? This is useful when multiple mods have conflicting shortcut configurations

## What's new in version 1.8.3:

### New functions:

- You can now replace the cover of a mod card by dragging and dropping an image onto the card!



### Better visuals :

-  Add animation of filter of selected



## What's new in version 1.8.2:

### New functions:

- Auto apply when you select mods, it is in the setting page
- Add about page
- Added Selected filtering option to make it easier to see what mods have been selected.



### Better visuals :

-  Optimize Page Layout



### Optimize performance

- Improved loading speed



## What's new in version 1.8.1:

### New functions:

-  [test function] Add function that you can automatically switch ZZZ to the foreground and refresh 3dmigoto after applying mods ?This requires administrator privileges to invoke the application process and to simulate pressing F10)
- This feature doesn't work as well as I thought it would, after hitting apply you still have to wait 2-3s for the app to get ZZZ's window and top it and activate F10 (which might as well be manually refreshing it yourself)
- Also, turning on this feature requires you to manually turn it on using the administrator, which is a bit of a hassle. Therefore, it is turned off by default, you can view and enable this experimental feature in the settings.



### Better visuals :

-  Optimize Page Layout



## What's new in version 1.8:

### New functions:



- Saves the window position, size and state (fullscreen or not) when you close the manager.
- Restores those values when you open the manager again.

Thanks the help from soliddanii,he/she added this function, I've tested it and it works fine!

- Compressed and Expanded modes, in compressed mode, the image will be used as the background of the card, the whole card will be smaller and show more items. The toggle button is at the bottom left corner.



### Translation fixed:



- With the help from [Ascant](https://gamebanana.com/members/3569784), I fixed some translation problems. Thanks!



# About the program



## What it can ?

It can help you to manage your mod in Mods file of ZZMI.
By using Material You theme , it looks very pretty~
Main function:

1.Display your mods as cards in the main page
2.Control able/disable by simply click
3.Add the description to each mod (You can add a description of the hotkeys?
4.Create presets and you can apply your presets easily!



## How to use ?

Just download and unzip the file behand and run the exe !
Theoretically, the program will no longer erase files from your mods folder, but this problem is still possible. Therefore, it is recommended to back up your mods before using this program 

### How do I manage my mods?  



- Once you've put your mod in the modResourceBackpack folder, you'll be able to see your mod in the main window of the program, select the mod card to enable it  or disable it, and click on the app configuration to enable it in 3dmigoto.
-  (You should press F10 to refresh 3dmigoto to enable the change, and sometimes you need to change the scene to load the mods)  



### How do I edit my mod information? (Cover Image/Character/Description)  

- On the main page, click on the mod you want to change
- Click on the Edit mod info option in the right-hand column
- Follow the GUI prompts to edit the mod information


For ease of management, the name of the mod is the same as the folder name, so if you want a better display, it is recommended to set a separate cover for each mod.
In the mod description, it is recommended to fill in the information related to the shortcut, and use the cover of the mod to distinguish its content
Old method:
This method can still be used, but unless you are completely sure, it is recommended to use the GUI interface

- After you add the mod to the modResourceBackpack folder, you will be able to see your mod on the main page, and in most cases, it will show the default image, unknown character, and no description
- ~Once you've clicked on the mod card display on the main page, you'll be able to view the mod's information in more detail in the menu on the right, and you'll see two buttons: open the mod folder and edit the mod info.
- Click the Open mod folder button, and then put the cover image you want to display (supports PNG, JPG, JPEG format images), you can easily set the display cover of the mod, and the cover image will be cropped to 4:3 size and displayed on the top of the card. (You may need to reopen the program or press crtl+R to apply the changes)~  
- Clicking on Edit mod info will open the mod.json file (what app to use to open the default app based on your computer's settings) and you'll see something like this:

```
"character": "Unknow",
"description": "No description",
"imagePath": "preview.png"
```

- Just replace the double quotes to apply your own settings  (Text content cannot contain line breaks or charcater like " and \\)   (You may need to reopen the program or press crtl+R to apply the changes)~  


- For more complex environments (e.g. multiple images in a folder), you will need to name the cover image you want to display as “preview”  (supports PNG, JPG, JPEG format images)


If you want to know more about the features, you still need to check out the documentation below
 And if you have any better ideas, please feel free to share them with me

## HotKeys

- Ctrl + W to close the window.
- Ctrl + R to refresh the window.
- Ctrl + Shift + =  to enlarge the window  
- Ctrl + -  to shrink the window  
- Ctrl + 0 to set the zoom to default.



## Q&A



### Where did my mod go and why don't I see it in the Mods folder?     



- When you choose to move mods automatically, the program will move your mods from Mods to modResourceBackpack for automatic management  



### Why can I only see the four mods named 1234 or display nothing and I can't do anything?  



- This is caused by you not initializing correctly, make sure you download the latest version of ZZZ mod manager and try again.  
- If that still doesn't work, you'll need to tap on the small gear in the bottom left, then tap on the Reset All Settings button, after which you'll need to reopen the app. If everything looks good, this will open the initial configuration page (which will first ask you to select the language), read the configuration **carefully**, and after that, the program will be able to run normally.  



### Why did I find that he was deleting files in my Mods folder?  



- Actually, this mod manager manages mods by creating a shortcut for the mod folder, so it doesn't delete your folder, but in some cases, this can still happen. Therefore, it is recommended to back up your mods before using this program.
- The program will move your mods to the modResourceBackpack folder, so if you can't find your mods in the Mods folder, you can find them in the modResourceBackpack folder.



# Update Log

## What's new in version 1.7.1 ?little-update)

### Function added:

- Refresh button on the left corner
- Snack tip after your apply

### Better visuals:

- Optimized the animation and display of mod cards
- Fixed a series of font issues and now they look beautiful
- Change the first-load-page into a designed dark theme

### Bugs fixed:

- In the card display list, the first 8 cards are displayed abnormally and cannot be added to the category column properly



## What's new in version 1.7:

### Performance optimization  

- Improved the speed of opening the software
- Mod cards that are outside the viewport will not be animated
- Optimized code logic
- remove the tape page

### Better visuals:

- Optimized the animation of mod cards
- Fixed a series of misalignment issues and now they look aligned and beautiful

### Bugs fixed:

- When you switch between presets, the information window on the right will not change



## What's new in version 1.6:

### New functions:

- The implementation principle of the application module is changed. Now there will be no file movement delay, and the current mod status will be saved.
- The ability to edit mod information in the program has been added, and you can now simply edit mod information in the program.



## What's new in version 1.5:

### New functions:

1. Added theme selection function (dark theme is recommended, I imitated it according to the design style of zzz)  
2. Added a button to close the window, which is placed in the bottom left corner  
3. Added text descriptions for icon buttons  
4. The mod files in your mods folder will now never be delete now, and a warning window and action selection will pop up in case of conflicts  



### Better visuals :

1.The color scheme is modeled after the ZZZ design  
2. Optimized the display effect of filtering by role
3. Added a very, very good display effect of mod cards, which will have corresponding animations and display effects when they are selected or unselected.![](https://img520.com/4uig49.gif)
4. Added a highlight when a preset is selected  

### Bugs fixed:

1. When program find a folder in the Mods folder that is not being managed, a warning window and action options will appear, and you can choose what to do with the mods that are not managed (ignore: ignore, the file will not be deleted or moved; Move to ModResourceBackpack: Move the mod to the modResourceBackpack folder for program management  
2. Presets are automatically saved when you change the choice of mod cards  now.
3.Some of the text has not been replaced with the translated text  



I use ai to translate the text for me, there may be something that is not clear ......
document?[XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto (github.com)](https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto/)



# Distribution

## How to distribute this software?

- You can distribute this software freely, but you must not modify the software and must not use it for commercial purposes.
- If you want to modify the software, you must indicate the source of the software and the original author of the software.
- If you want to use this software for commercial purposes, please contact me first.

# Contact me
If you have any questions or suggestions, please contact me via the following methods:

- Email: [helloXLxz](mailto:helloXlxz233@gmail.com) 
- Github: [XiaoLinXiaoZhu](https://github.com/XiaoLinXiaoZhu)

# License

This software is licensed under the GPL-3.0 license, and you can view the license file in the software folder.

# Buy me a cup of coffee ?

If you like this software and are willing to tip me, you can tip me on kofi: [buy me a coffee](https://ko-fi.com/helloxlxz)