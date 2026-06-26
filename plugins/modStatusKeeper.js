/**
 * Mod Status Keeper - Persistent Variable Sync System
 *
 * Automatically syncs persistent variables from d3dx_user.ini to mod files
 * with backup protection and universal mod structure support.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * 🔄 AUTO SYNC:
 * - Monitors d3dx_user.ini for changes and syncs to ALL mod INI files
 * - Works with any mod structure (simple, nested, complex folders)
 * - Case-insensitive variable matching with Unicode support
 * - Syncs [Constants] sections from main to LOD files
 *
 * 💾 BACKUP SYSTEM:
 * - Creates .msk backup files for all INI configurations
 * - Restore from backups with safety protection
 * - Delete backups when no longer needed
 *
 * 🔒 SAFETY:
 * - Backup requirements with override option
 * - Safety locks for destructive operations
 * - Error handling with detailed logging
 *
 * ⚠️ LIMITATION:
 * Only works while XX Mod Manager is running. When closed/minimized/sleeping,
 * file monitoring stops until manager is restored / in focus.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * HOW IT WORKS:
 * 1. Parse d3dx_user.ini: $\\mods\\<path>\\<file>.ini\\<variable> = value
 * 2. Update main files (non-LOD) with matching variables
 * 3. Sync [Constants] from main files to LOD files in same directory
 * 4. Direct translation - no guessing or assumptions
 *
 * Author: Jank8 (https://github.com/Jank8)
 * AI Assistant: Claude Sonnet 4 (via GitHub Copilot)
 * Version: 3.1.0 - Streamlined with essential features
 */

// ==================== BARE MINIMUM REQUIREMENTS START ====================
// These imports are required for basic plugin functionality
const fs = require("node:fs"); // [CUSTOM] - Only needed for our file operations
const path = require("node:path"); // [CUSTOM] - Only needed for our file operations

// [REQUIRED] - Plugin identifier, must be unique
const pluginName = "modStatusKeeper";

// ==================== LOGGING MODULE START ====================

/*
 * FILE LOGGING SYSTEM
 * ====================
 *
 * This module provides comprehensive logging functionality for debugging and
 * monitoring plugin operations. Logs are written to both console and file
 * for comprehensive debugging support.
 *
 * LOGGING FEATURES:
 *
 * 1. Dual Output System:
 *    - Console logging: For real-time debugging during development
 *    - File logging: For persistent debugging and troubleshooting
 *    - Consistent formatting across both outputs
 *
 * 2. Log Levels:
 *    - INFO: Normal operation messages (default)
 *    - WARN: Warning conditions that don't stop operation
 *    - ERROR: Error conditions that may affect functionality
 *
 * 3. Timestamp Integration:
 *    - ISO 8601 timestamp format for precise timing
 *    - Consistent timestamp format across all log entries
 *    - Useful for debugging timing-related issues
 *
 * 4. File Management:
 *    - Log file location: modSourcePath/../modStatusKeeper.log
 *    - Automatic file creation and session initialization
 *    - Append mode for continuous logging across operations
 *    - Error handling for file write failures
 *
 * LOG FILE LOCATION:
 * - Path: XX-Mod-Manager/modStatusKeeper.log
 * - Format: [timestamp] [level] message
 * - Encoding: UTF-8 for Unicode path support
 *
 * USAGE:
 * - log('message') - INFO level
 * - log('message', 'WARN') - WARNING level
 * - log('message', 'ERROR') - ERROR level
 */

/**
 * File logging instance
 * @type {string|null} Path to the log file, null if not initialized
 */
let logFile = null;

/**
 * Initialize logging to file
 * Creates or opens the log file and writes session start marker
 * @param {string} logPath - Absolute path to write log file
 */
const initFileLogging = (logPath) => {
  logFile = logPath;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
  fs.writeFileSync(
    logFile,
    `=== ModStatusKeeper Log Started at ${timestamp} ===\n`,
    "utf8",
  );
};

/**
 * Write message to both console and log file
 * Provides dual output for comprehensive debugging support
 * @param {string} message - Message to log
 * @param {string} level - Log level (INFO, WARN, ERROR)
 */
const log = (message, level = "INFO") => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  // Always log to console for real-time debugging
  console.log(message);

  // Only log to file if logging is enabled and file is initialized
  if (
    logFile &&
    (typeof loggingEnabled === "undefined" || loggingEnabled.data)
  ) {
    try {
      fs.appendFileSync(logFile, logMessage, "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
};

// ==================== LOGGING MODULE END ====================

// [REQUIRED] - Main plugin export structure
module.exports = {
  // [REQUIRED] - Plugin name property
  name: pluginName,
  // [REQUIRED] - Internationalized display names for the plugin
  t_displayName: {
    zh_cn: "Mod状态保持器",
    en: "Mod Status Keeper",
  },
  /**
   * [REQUIRED] - Plugin initialization function
   * Sets up all UI components and functionality
   * @param {Object} iManager - The mod manager interface object
   */
  init(iManager) {
    // [REQUIRED] - Array to hold all plugin configuration items (UI components)
    const pluginData = [];
    pluginData.push({
      name: "info",
      type: "markdown",
      description: "Info",
      t_description: {
        zh_cn: `感谢 [Jank8](https://github.com/Jank8) 对该插件的贡献
# Mod状态保持器
# 它如何工作？
通过监控 d3dx_user.ini 文件的变化并将持久变量自动同步到所有模组 INI 文件。我们可以将Mod的状态永远保存在模组中，这样即使是禁用模组后，模组的状态也不会丢失。
# !注意、限制!
该插件会修改模组的 INI 文件，因此请确保在使用前 !备份您的模组文件! 。
---`,
        en: `Thanks to [Jank8](https://github.com/Jank8) for contributing to this plugin
# Mod Status Keeper
# How does it work?
By monitoring changes to the d3dx_user.ini file and automatically syncing persistent variables to all mod INI files, we can keep the state of the mod permanently saved within the mod itself, so that even if the mod is disabled, its state will not be lost.
# Notes & Limitations
This plugin modifies the mod's INI files, so please ensure you !back up your mod files! before use.
---`,
      },
    });

    // ==================== LOGGING MANAGEMENT MODULE START ====================
    /**
     * [CUSTOM FEATURE] - Logging Toggle
     * Control whether the plugin creates log files
     * When disabled, only console logging is used
     */
    const loggingEnabled = {
      name: "loggingEnabled",
      type: "boolean", // Use boolean for toggle switch
      data: true, // Enabled by default
      displayName: "Enable Log File Creation",
      t_displayName: {
        zh_cn: "启用日志文件创建",
        en: "Enable Log File Creation",
      },
      onChange: (value) => {
        const logPath = path.join(
          path.resolve(iManager.config.modSourcePath),
          "..",
          "modStatusKeeper.log",
        );
        if (value) {
          initFileLogging(logPath);
          log("File logging enabled");
          iManager.t_snack(
            {
              en: "Log file creation enabled",
              zh_cn: "日志文件创建已启用",
            },
            "success",
          );
        } else {
          logFile = null;
          console.log("File logging disabled - console only");
          iManager.t_snack(
            {
              en: "Log file creation disabled - console logging only",
              zh_cn: "日志文件创建已禁用 - 仅控制台日志",
            },
            "info",
          );
        }
      },
    };

    // Initialize file logging based on the toggle default value
    const logPath = path.join(
      path.resolve(iManager.config.modSourcePath),
      "..",
      "modStatusKeeper.log",
    );
    if (loggingEnabled.data) {
      initFileLogging(logPath);
      log(`Plugin initialized. Log file: ${logPath}`);
    } else {
      console.log(`Plugin initialized. File logging disabled.`);
    }
    log(`Mod source path: ${iManager.config.modSourcePath}`);

    // ==================== BARE MINIMUM REQUIREMENTS END ====================

    // ==================== CUSTOM UPDATER MODULE START ====================

    /*
     * PERSISTENT VARIABLE SYNC SYSTEM
     * ================================
     *
     * This module implements automatic synchronization of persistent variables from
     * d3dx_user.ini to mod INI files. It handles updating main mod files and then
     * immediately copying their entire [Constants] sections to LOD files.
     *
     * SIMPLIFIED SYNC ALGORITHM:
     *
     * 1. Parse d3dx_user.ini for lines matching: $\mods\folder\file.ini\variable = value
     *
     * 2. Classify files as either "main" files or "LOD" files:
     *    - LOD files: contain "_lod" in filename (e.g., anby_lod1.ini)
     *    - Main files: all other INI files
     *
     * 3. Update Strategy:
     *    a) Main files: Update directly with their values from d3dx_user.ini
     *    b) Immediate LOD sync: After updating each main file, copy its entire
     *       [Constants] section to all LOD files in the same directory
     *    c) Orphaned LOD files: Update individually if no main file exists
     *
     * 4. Variable patterns supported:
     *    - global persist $varname = value
     *    - $varname = value
     *
     * SAFETY FEATURES:
     * - Backup requirement: Sync only allowed if .msk backup files exist
     * - Override toggle: "I DON'T CARE ABOUT BACKUPS" bypasses safety check
     * - File watching: Automatic sync when d3dx_user.ini changes
     * - Periodic sync: Forced sync every 5 seconds as backup mechanism
     * - Auto-start: File watcher and periodic sync start automatically when plugin loads
     * - Error handling: Individual file failures don't stop the entire operation
     */

    /**
     * Helper function to check if backup files (.msk) exist in the workspace
     * @returns {boolean} True if at least one .msk backup file exists
     */
    const hasBackupFiles = () => {
      let backupExists = false;

      /**
       * Recursive function to search for .msk backup files
       * @param {string} dir - Directory path to search
       */
      const searchForBackups = (dir) => {
        if (!fs.existsSync(dir) || backupExists) return;

        const items = fs.readdirSync(dir);

        for (const item of items) {
          if (backupExists) break; // Early exit if backup found

          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            searchForBackups(itemPath);
          } else if (stat.isFile() && item.toLowerCase().endsWith(".msk")) {
            backupExists = true;
            log(`Found backup file: ${itemPath}`);
            break;
          }
        }
      };

      const modSourcePath = path.resolve(iManager.config.modSourcePath);
      log(`Checking for backup files in: ${modSourcePath}`);
      searchForBackups(modSourcePath);
      log(`Backup files exist: ${backupExists}`);
      return backupExists;
    };

    pluginData.push({
      name: "info",
      type: "markdown",
      description: "Info",
      t_description: {
        zh_cn: `# 将状态同步到模组 INI 文件
你需要选择 d3dx_user.ini 的位置，之后程序能够将持久变量从 d3dx_user.ini 文件同步到所有模组 INI 文件。
如果你使用 XXMM 作为模组管理器，程序会尝试自动获取 d3dx_user.ini 的位置。`,
        en: `# Sync Mod Status to Mod INI Files
You need to select the location of d3dx_user.ini, after which the program can sync persistent variables from the d3dx_user.ini file to all mod INI files.
If you use XXMM as your mod manager, the program will try to automatically get the location of d3dx_user.ini.`,
      },
    });

    /**
     * [CUSTOM FEATURE] - D3DX User INI File Path
     * gets the path to the d3dx_user.ini file
     */
    const d3dxUserIniPath = {
      name: "d3dxUserIniPath",
      type: "ini",
      data: "", // Default to empty string
      displayName: "D3DX User INI Path",
      t_displayName: {
        zh_cn: "d3dx_user.ini 路径",
        en: "d3dx_user.ini Path",
      },
      onChange: (value) => {
        // check if the provided path is valid
        const isValidPath = fs.existsSync(value);
        if (!isValidPath) {
          iManager.t_snack(
            {
              en: "Invalid D3DX User INI Path.",
              zh_cn: "无效的 D3DX 用户 INI 路径。",
            },
            "error",
          );
        }
        d3dxUserIniPath.data = value; // Update the path
      },
    };
    pluginData.push(d3dxUserIniPath);

    /**
     * [CUSTOM FEATURE] - Auto-Updater Toggle
     * Monitors d3dx_user.ini and syncs mod status to mod INI files
     */
    const autoUpdater = {
      name: "autoUpdater",
      data: false, // Default to disabled
      type: "boolean",
      displayName: "Auto-Update Mod Settings",
      // Internationalized labels
      t_displayName: {
        zh_cn: "自动同步",
        en: "Auto-Sync",
      },
      /**
       * Handle auto-updater toggle state changes
       * @param {boolean} value - New toggle state
       */
      onChange: (value) => {
        if (value) {
          // Check if backup files exist before enabling auto-sync (unless override is enabled)
          if (!backupOverride.data && !hasBackupFiles()) {
            autoUpdater.data = false; // Keep toggle disabled
            iManager.t_snack(
              {
                en: "Cannot enable auto-sync: No backup files (.msk) found. Please create backups first or enable 'I DON'T CARE ABOUT BACKUPS'.",
                zh_cn:
                  "无法启用自动同步：未找到备份文件(.msk)。请先创建备份或启用'我不在乎备份'。",
              },
              "warning",
            );
            return false; // Prevent enabling auto-sync
          }

          // Check if d3dx_user.ini path is set
          const d3dxUserPath = getD3dxUserPath();
          if (!d3dxUserPath) {
            iManager.t_snack(
              {
                en: "d3dx_user.ini path is not set",
                zh_cn: "d3dx_user.ini路径未设置",
              },
              "error",
            );
            return false; // Prevent enabling auto-sync
          }

          autoUpdater.data = value;
          startWatcher();
          startPeriodicSync();

          if (backupOverride.data) {
            iManager.t_snack(
              {
                en: "⚠️ Auto-updater enabled WITHOUT backup protection. File monitoring active ONLY while manager is running (stops when manager is closed/sleeping).",
                zh_cn:
                  "⚠️ 已启用自动更新器且无备份保护。管理器运行时文件监控处于活动状态。",
              },
              "warning",
            );
          } else {
            iManager.t_snack({
              en: "Auto-updater enabled. File monitoring active ONLY while manager is running (stops when manager is closed/sleeping).",
              zh_cn: "自动更新器已启用。管理器运行时文件监控处于活动状态。",
            });
          }
        } else {
          autoUpdater.data = value;
          stopWatcher();
          stopPeriodicSync();
          iManager.t_snack({
            en: "Auto-updater disabled. Background monitoring stopped.",
            zh_cn: "自动更新器已禁用。后台监控已停止。",
          });
        }
      },
    };
    pluginData.push(autoUpdater);

    // Auto-updater description
    pluginData.push({
      name: "desc_autoUpdater",
      type: "markdown",
      data: `**Auto-Update Mod Settings** - Monitors **d3dx_user.ini** for changes and automatically syncs to ALL mod INI files. **⚠️ LIMITATION:** Only works while XX Mod Manager is running. Stops when closed/minimized/sleeping.`,
      description:
        "**Auto-Update Mod Settings** - Monitors **d3dx_user.ini** for changes and automatically syncs to ALL mod INI files. **⚠️ LIMITATION:** Only works while XX Mod Manager is running. Stops when closed/minimized/sleeping.",
      t_description: {
        en: `Monitors **d3dx_user.ini** for changes and automatically syncs to ALL mod INI files.
!**⚠️ LIMITATION:** Only works while XX Mod Manager is running. Stops when closed/minimized/sleeping.! `,
        zh_cn: `监控 **d3dx_user.ini** 文件变化并自动同步到所有模组INI文件。
!**⚠️ 限制：** 仅在XX模组管理器运行时生效，关闭/最小化/休眠时停止监控。! `,
      },
      displayName: "",
    });

    // Manual sync button
    pluginData.push({
      name: "syncButton",
      data: "",
      type: "iconbutton",
      displayName: "Sync Now",
      t_displayName: {
        zh_cn: "立即同步",
        en: "Sync Now",
      },
      buttonName: "sync",
      t_buttonName: {
        zh_cn: "同步",
        en: "Sync",
      },
      /**
       * Manual sync operation handler
       */
      onChange: async () => {
        // Check if backup files exist before allowing manual sync (unless override is enabled)
        if (!backupOverride.data && !hasBackupFiles()) {
          iManager.t_snack(
            {
              en: "Cannot sync: No backup files (.msk) found. Please create backups first or enable 'I DON'T CARE ABOUT BACKUPS'.",
              zh_cn:
                "无法同步：未找到备份文件(.msk)。请先创建备份或启用'我不在乎备份'。",
            },
            "warning",
          );
          return;
        }

        try {
          iManager.showDialog("loading-dialog");

          if (backupOverride.data) {
            iManager.t_snack(
              {
                en: "⚠️ Syncing persistent variables WITHOUT backup protection...",
                zh_cn: "⚠️ 正在同步持久变量且无备份保护...",
              },
              "warning",
            );
          } else {
            iManager.t_snack({
              en: "Syncing persistent variables...",
              zh_cn: "正在同步持久变量...",
            });
          }

          const result = await syncPersistentVariables();

          let message = `Sync complete! Updated ${result.updateCount} variables in ${result.fileCount} files`;
          let message_cn = `同步完成！在${result.fileCount}个文件中更新了${result.updateCount}个变量`;

          if (result.lodSyncCount > 0) {
            message += ` and synced [Constants] to ${result.lodSyncCount} LOD files`;
            message_cn += `，并同步[Constants]到${result.lodSyncCount}个LOD文件`;
          }

          iManager.t_snack(
            {
              en: message,
              zh_cn: message_cn,
            },
            "success",
          );
        } catch (error) {
          log(`Sync failed: ${error.message}`, "ERROR");
          iManager.t_snack(
            {
              en: `Sync failed: ${error.message}`,
              zh_cn: `同步失败：${error.message}`,
            },
            "error",
          );
        } finally {
          iManager.dismissDialog("loading-dialog");
        }
      },
    });

    // Manual sync description
    pluginData.push({
      name: "desc_syncButton",
      type: "markdown",
      data: "**Sync Now** - Manually trigger sync of ALL persistent variables from **d3dx_user.ini** to mod INI files. Requires backup files unless override enabled.",
      description:
        "**Sync Now** - Manually trigger sync of ALL persistent variables from **d3dx_user.ini** to mod INI files. Requires backup files unless override enabled.",
      t_description: {
        en: `Manually trigger sync of ALL persistent variables from **d3dx_user.ini** to mod INI files. 
Requires backup files unless enabled 'I DON'T CARE ABOUT BACKUPS'.`,
        zh_cn: `手动触发从 **d3dx_user.ini** 到模组INI文件的所有持久变量同步。
需要备份文件，除非启用 '我不在乎备份'。`,
      },
      displayName: "",
    });

    // Backup override toggle
    const backupOverride = {
      name: "backupOverride",
      data: false, // Default to disabled (safe)
      type: "boolean",
      displayName: "I DON'T CARE ABOUT BACKUPS!!!",
      // Internationalized labels
      t_displayName: {
        zh_cn: "我不在乎备份",
        en: "I DON'T CARE ABOUT BACKUPS",
      },
      /**
       * Handle backup override toggle state changes
       * @param {boolean} value - New toggle state
       */
      onChange: (value) => {
        backupOverride.data = value;
        if (value) {
          iManager.t_snack(
            {
              en: "⚠️ WARNING: Backup protection disabled! Sync operations can now overwrite files without backups.",
              zh_cn:
                "⚠️ 警告：已禁用备份保护！同步操作现在可以在没有备份的情况下覆盖文件。",
            },
            "warning",
          );
        } else {
          iManager.t_snack({
            en: "Backup protection re-enabled. Sync operations now require backup files.",
            zh_cn: "已重新启用备份保护。同步操作现在需要备份文件。",
          });
        }
      },
    };
    pluginData.push(backupOverride);

    // Backup override description
    pluginData.push({
      name: "desc_backupOverride",
      type: "markdown",
      data: "**I Don't Care About Backups** - DANGEROUS: Disables all backup checks. **⚠️ WARNING:** Without backups, you cannot recover from mistakes.",
      description:
        "**I Don't Care About Backups** - DANGEROUS: Disables all backup checks. **⚠️ WARNING:** Without backups, you cannot recover from mistakes.",
      t_description: {
        en: "**I Don't Care About Backups** - DANGEROUS: Disables all backup checks. **⚠️ WARNING:** Without backups, you cannot recover from mistakes.",
        zh_cn:
          "**我不在乎备份** - 危险：禁用所有备份检查。**⚠️ 警告：** 没有备份，您无法从错误中恢复。",
      },
      displayName: "",
    });

    // ==================== CUSTOM UPDATER MODULE END ====================

    // ==================== VISUAL SEPARATOR SECTION ====================

    /*
     * UI VISUAL SEPARATORS
     * ====================
     *
     * This section creates visual separation between major functional groups
     * in the plugin interface. Uses markdown horizontal rules to create
     * clear visual boundaries.
     *
     * SEPARATOR PURPOSE:
     * - Separates sync functionality from backup management
     * - Creates logical grouping of related features
     * - Improves UI readability and organization
     * - Follows consistent design pattern from other plugins
     *
     * IMPLEMENTATION:
     * - Three consecutive markdown elements with '---' content
     * - Creates triple-line visual break in the interface
     * - Consistent with XX Mod Manager UI design standards
     */

    /**
     * [VISUAL] - Triple separator between sync and backup sections
     */
    pluginData.push({
      name: "separator1",
      data: "",
      type: "markdown",
      displayName: "Separator",
      description: "---",
    });

    pluginData.push({
      name: "separator2",
      data: "",
      type: "markdown",
      displayName: "Separator",
      description: "---",
    });

    pluginData.push({
      name: "separator3",
      data: "",
      type: "markdown",
      displayName: "Separator",
      description: "---",
    });

    // ==================== CUSTOM BACKUP MODULE START ====================

    /*
     * BACKUP MANAGEMENT SYSTEM
     * =========================
     *
     * This module provides comprehensive backup functionality for mod INI files.
     * Creates .msk (Mod Status Keeper) backup files that preserve the original
     * state of mod configurations.
     *
     * BACKUP FEATURES:
     *
     * 1. Recursive Backup Creation:
     *    - Scans entire mod source directory tree
     *    - Creates .msk copies of all .ini files
     *    - Preserves directory structure
     *
     * 2. Smart Filtering:
     *    - Skips files with "disabled" in filename
     *    - Prevents duplicate backups (won't overwrite existing .msk files)
     *    - Only processes .ini files (ignores other file types)
     *
     * 3. Safety Integration:
     *    - Backup existence checks for sync operations
     *    - hasBackupFiles() helper function for validation
     *    - Integration with safety override system
     *
     * 4. User Feedback:
     *    - Progress notifications during operation
     *    - Detailed statistics (created vs skipped files)
     *    - Full-screen loading dialogs for long operations
     *
     * BACKUP FILE FORMAT:
     * - Original: mod.ini
     * - Backup: mod.ini.msk
     * - Simple append of .msk extension for easy identification
     */

    /**
     * [CUSTOM FEATURE] - Create Backup Button
     * Recursively finds all .ini files and creates .msk backup copies
     * Skips files with "disabled" in name and existing backups
     */
    pluginData.push({
      name: "backupButton",
      data: "",
      type: "iconbutton",
      displayName: "Create Backup",
      // Internationalized button labels
      t_displayName: {
        zh_cn: "创建备份",
        en: "Create Backup",
      },
      buttonName: "save", // Icon identifier
      t_buttonName: {
        zh_cn: "备份",
        en: "Backup",
      },
      /**
       * Backup operation handler
       * Performs recursive backup of all .ini files to .msk format
       */
      onChange: async () => {
        try {
          // Show full-screen loading dialog
          iManager.showDialog("loading-dialog");

          // Notify user that backup is starting
          iManager.t_snack({
            en: "Creating backup of INI files...",
            zh_cn: "正在创建INI文件备份...",
          });

          // Counters for operation tracking
          let backupCount = 0; // Successfully backed up files
          let skipCount = 0; // Skipped files (disabled/existing)

          /**
           * Recursive function to backup INI files
           * Processes directories and their subdirectories
           * @param {string} dir - Directory path to process
           */
          const backupIniFiles = (dir) => {
            // Skip if directory doesn't exist
            if (!fs.existsSync(dir)) return;

            // Get all items in the directory
            const items = fs.readdirSync(dir);

            // Process each item in the directory
            for (const item of items) {
              const itemPath = path.join(dir, item);
              const stat = fs.statSync(itemPath);

              if (stat.isDirectory()) {
                // Recursively process subdirectories
                backupIniFiles(itemPath);
              } else if (stat.isFile() && item.toLowerCase().endsWith(".ini")) {
                // Process INI files only

                // Skip files with "disabled" in the name (case-insensitive)
                if (item.toLowerCase().includes("disabled")) {
                  skipCount++;
                  continue;
                }

                // Generate backup filename with .msk extension
                const backupFileName = `${item}.msk`;
                const backupFilePath = path.join(dir, backupFileName);

                // Skip if backup already exists (prevent duplicates)
                if (fs.existsSync(backupFilePath)) {
                  skipCount++;
                  continue;
                }

                try {
                  // Copy INI file to .msk backup file
                  fs.copyFileSync(itemPath, backupFilePath);
                  backupCount++;
                } catch (err) {
                  // Log individual file backup errors but continue
                  log(`Failed to backup ${itemPath}: ${err.message}`, "ERROR");
                }
              }
            }
          };

          // Start backup operation from the mod source directory
          backupIniFiles(iManager.config.modSourcePath);

          // Show success notification with statistics
          iManager.t_snack(
            {
              en: `Backup complete! Created ${backupCount} .msk files, skipped ${skipCount} existing/disabled files`,
              zh_cn: `备份完成！创建了${backupCount}个.msk文件，跳过了${skipCount}个已存在/已禁用文件`,
            },
            "success",
          );
        } catch (error) {
          // Handle and report any unexpected errors
          log(`Backup failed: ${error.message}`, "ERROR");
          iManager.t_snack(
            {
              en: `Backup failed: ${error.message}`,
              zh_cn: `备份失败：${error.message}`,
            },
            "error",
          );
        } finally {
          // Always dismiss loading dialog, even if errors occur
          iManager.dismissDialog("loading-dialog");
        }
      },
    });

    // Create backup description
    pluginData.push({
      name: "desc_backupButton",
      type: "markdown",
      data: "**Create Backup** - Creates .msk backup copies of all mod INI files for safety. Always create backups before syncing!",
      description:
        "**Create Backup** - Creates .msk backup copies of all mod INI files for safety. Always create backups before syncing!",
      t_description: {
        en: "**Create Backup** - Creates .msk backup copies of all mod INI files for safety. Always create backups before syncing!",
        zh_cn:
          "**创建备份** - 为安全起见，创建所有模组INI文件的.msk备份副本。同步前请务必创建备份！",
      },
      displayName: "",
    });

    /**
     * [CUSTOM FEATURE] - Safety Toggle
     * Prevents accidental execution of destructive operations
     * Must be enabled before restore or delete operations
     */
    const safetyToggle = {
      name: "safetyToggle",
      data: false, // Default to disabled (safe)
      type: "boolean",
      displayName: "Safety Lock",
      // Internationalized labels
      t_displayName: {
        zh_cn: "安全锁",
        en: "Safety Lock",
      },
      /**
       * Handle safety toggle state changes
       * @param {boolean} value - New toggle state
       */
      onChange: (value) => {
        safetyToggle.data = value;
        // Provide user feedback when safety is enabled
        if (value) {
          iManager.t_snack({
            en: "Safety lock enabled. You can now use restore/delete functions.",
            zh_cn: "安全锁已启用。现在可以使用恢复/删除功能。",
          });
        }
      },
    };
    pluginData.push(safetyToggle);

    // Safety toggle description
    pluginData.push({
      name: "desc_safetyToggle",
      type: "markdown",
      data: "**Safety Lock** - Prevents accidental use of destructive operations. Must be ON to use restore/delete buttons.",
      description:
        "**Safety Lock** - Prevents accidental use of destructive operations. Must be ON to use restore/delete buttons.",
      t_description: {
        en: "**Safety Lock** - Prevents accidental use of destructive operations. Must be ON to use restore/delete buttons.",
        zh_cn:
          "**安全锁** - 防止意外使用破坏性操作。必须开启才能使用恢复/删除按钮。",
      },
      displayName: "",
    });

    // ==================== CUSTOM BACKUP MODULE END ====================

    // ==================== CUSTOM RESTORE MODULE START ====================

    /*
     * BACKUP RESTORATION SYSTEM
     * ==========================
     *
     * This module handles restoration of mod INI files from their .msk backup copies.
     * Provides a way to revert all modifications and return to the backed-up state.
     *
     * RESTORE FEATURES:
     *
     * 1. Complete Restoration:
     *    - Recursively finds all .msk backup files
     *    - Copies .msk content back to original .ini filenames
     *    - Preserves directory structure and file organization
     *
     * 2. Safety Integration:
     *    - Requires safety lock to be enabled before operation
     *    - Auto-disables safety lock after completion
     *    - Clear warnings about data overwrite consequences
     *
     * 3. Robust Operation:
     *    - Continues operation even if individual files fail
     *    - Tracks success/failure statistics
     *    - Detailed logging of restore process
     *
     * 4. User Protection:
     *    - Full-screen loading dialog during operation
     *    - Clear warnings about overwriting current settings
     *    - Progress feedback and final statistics
     *
     * RESTORE PROCESS:
     * 1. Safety lock verification
     * 2. Recursive scan for .msk files
     * 3. Copy .msk → .ini (overwriting existing)
     * 4. Statistics collection and reporting
     * 5. Auto-disable safety lock
     *
     * WARNING: This operation overwrites current mod settings!
     */

    /**
     * [CUSTOM FEATURE] - Restore Button
     * Restores all .ini files from their .msk backups
     * Requires safety lock to be enabled
     */
    pluginData.push({
      name: "restoreButton",
      data: "",
      type: "iconbutton",
      displayName: "Restore from Backup",
      // Internationalized labels
      t_displayName: {
        zh_cn: "从备份恢复",
        en: "Restore from Backup",
      },
      buttonName: "restore", // Icon identifier
      t_buttonName: {
        zh_cn: "恢复",
        en: "Restore",
      },
      /**
       * Restore operation handler
       * Copies all .msk files back to their original .ini names
       */
      onChange: async () => {
        // Safety check: ensure safety lock is enabled
        if (!safetyToggle.data) {
          iManager.t_snack(
            {
              en: "Please enable the safety lock first",
              zh_cn: "请先启用安全锁",
            },
            "warning",
          );
          return;
        }

        try {
          // Show full-screen loading dialog
          iManager.showDialog("loading-dialog");

          // Notify user that restore is starting
          iManager.t_snack({
            en: "Restoring INI files from backups...",
            zh_cn: "正在从备份恢复INI文件...",
          });

          // Counters for operation tracking
          let restoreCount = 0; // Successfully restored files
          let skipCount = 0; // Failed restoration attempts

          /**
           * Recursive function to restore from .msk backup files
           * Processes directories and their subdirectories
           * @param {string} dir - Directory path to process
           */
          const restoreFromBackups = (dir) => {
            // Skip if directory doesn't exist
            if (!fs.existsSync(dir)) return;

            // Get all items in the directory
            const items = fs.readdirSync(dir);

            // Process each item in the directory
            for (const item of items) {
              const itemPath = path.join(dir, item);
              const stat = fs.statSync(itemPath);

              if (stat.isDirectory()) {
                // Recursively process subdirectories
                restoreFromBackups(itemPath);
              } else if (stat.isFile() && item.toLowerCase().endsWith(".msk")) {
                // Process .msk backup files only

                // Calculate original INI filename by removing .msk extension
                const originalFileName = item.slice(0, -4); // Remove last 4 chars (.msk)
                const originalFilePath = path.join(dir, originalFileName);

                try {
                  // Copy .msk file back to original .ini filename
                  fs.copyFileSync(itemPath, originalFilePath);
                  restoreCount++;
                } catch (err) {
                  // Log individual file restore errors but continue
                  console.error(`Failed to restore ${itemPath}:`, err);
                  skipCount++;
                }
              }
            }
          };

          // Start restore operation from the mod source directory
          restoreFromBackups(iManager.config.modSourcePath);

          // Auto-disable safety toggle after successful operation
          safetyToggle.data = false;

          // Show success notification with statistics
          iManager.t_snack(
            {
              en: `Restore complete! Restored ${restoreCount} files, failed ${skipCount} files`,
              zh_cn: `恢复完成！恢复了${restoreCount}个文件，失败${skipCount}个文件`,
            },
            "success",
          );
        } catch (error) {
          // Handle and report any unexpected errors
          console.error("Restore failed:", error);
          iManager.t_snack(
            {
              en: `Restore failed: ${error.message}`,
              zh_cn: `恢复失败：${error.message}`,
            },
            "error",
          );
        } finally {
          // Always dismiss loading dialog, even if errors occur
          iManager.dismissDialog("loading-dialog");
        }
      },
    });

    // Restore description
    pluginData.push({
      name: "desc_restoreButton",
      type: "markdown",
      data: "**Restore from Backup** - Overwrites current mod settings with backup data from .msk files. **⚠️ WARNING:** This will replace your current mod settings!",
      description:
        "**Restore from Backup** - Overwrites current mod settings with backup data from .msk files. **⚠️ WARNING:** This will replace your current mod settings!",
      t_description: {
        en: "**Restore from Backup** - Overwrites current mod settings with backup data from .msk files. **⚠️ WARNING:** This will replace your current mod settings!",
        zh_cn:
          "**从备份恢复** - 用.msk文件中的备份数据覆盖当前模组设置。**⚠️ 警告：** 这将替换您当前的模组设置！",
      },
      displayName: "",
    });

    /**
     * [CUSTOM FEATURE] - Delete All Backups Button
     * Removes all .msk backup files from the system
     * Requires safety lock to be enabled
     */
    pluginData.push({
      name: "deleteButton",
      data: "",
      type: "iconbutton",
      displayName: "Delete All Backups",
      // Internationalized labels
      t_displayName: {
        zh_cn: "删除所有备份",
        en: "Delete All Backups",
      },
      buttonName: "delete", // Icon identifier
      t_buttonName: {
        zh_cn: "删除",
        en: "Delete",
      },
      /**
       * Delete operation handler
       * Permanently removes all .msk backup files
       */
      onChange: async () => {
        // Safety check: ensure safety lock is enabled
        if (!safetyToggle.data) {
          iManager.t_snack(
            {
              en: "Please enable the safety lock first",
              zh_cn: "请先启用安全锁",
            },
            "warning",
          );
          return;
        }

        try {
          // Show full-screen loading dialog
          iManager.showDialog("loading-dialog");

          // Notify user that deletion is starting
          iManager.t_snack({
            en: "Deleting backup files...",
            zh_cn: "正在删除备份文件...",
          });

          // Counter for operation tracking
          let deleteCount = 0; // Successfully deleted files

          /**
           * Recursive function to delete .msk backup files
           * Processes directories and their subdirectories
           * @param {string} dir - Directory path to process
           */
          const deleteBackups = (dir) => {
            // Skip if directory doesn't exist
            if (!fs.existsSync(dir)) return;

            // Get all items in the directory
            const items = fs.readdirSync(dir);

            // Process each item in the directory
            for (const item of items) {
              const itemPath = path.join(dir, item);
              const stat = fs.statSync(itemPath);

              if (stat.isDirectory()) {
                // Recursively process subdirectories
                deleteBackups(itemPath);
              } else if (stat.isFile() && item.toLowerCase().endsWith(".msk")) {
                // Delete .msk backup files only
                try {
                  // Permanently delete the backup file
                  fs.unlinkSync(itemPath);
                  deleteCount++;
                } catch (err) {
                  // Log individual file deletion errors but continue
                  console.error(`Failed to delete ${itemPath}:`, err);
                }
              }
            }
          };

          // Start deletion operation from the mod source directory
          deleteBackups(iManager.config.modSourcePath);

          // Auto-disable safety toggle after successful operation
          safetyToggle.data = false;

          // Show success notification with statistics
          iManager.t_snack(
            {
              en: `Deletion complete! Deleted ${deleteCount} backup files`,
              zh_cn: `删除完成！删除了${deleteCount}个备份文件`,
            },
            "success",
          );
        } catch (error) {
          // Handle and report any unexpected errors
          console.error("Delete failed:", error);
          iManager.t_snack(
            {
              en: `Delete failed: ${error.message}`,
              zh_cn: `删除失败：${error.message}`,
            },
            "error",
          );
        } finally {
          // Always dismiss loading dialog, even if errors occur
          iManager.dismissDialog("loading-dialog");
        }
      },
    });

    // Delete backups description
    pluginData.push({
      name: "desc_deleteButton",
      type: "markdown",
      data: "**Delete All Backups** - Permanently deletes all .msk backup files to free disk space. **⚠️ WARNING:** Cannot be undone!",
      description:
        "**Delete All Backups** - Permanently deletes all .msk backup files to free disk space. **⚠️ WARNING:** Cannot be undone!",
      t_description: {
        en: "**Delete All Backups** - Permanently deletes all .msk backup files to free disk space. **⚠️ WARNING:** Cannot be undone!",
        zh_cn:
          "**删除所有备份** - 永久删除所有.msk备份文件以释放磁盘空间。**⚠️ 警告：** 无法撤销！",
      },
      displayName: "",
    });

    // ==================== CUSTOM DELETE MODULE END ====================

    // ==================== VISUAL SEPARATOR SECTION ====================
    /**
     * [VISUAL] - Triple separator between backup and logging sections
     */
    pluginData.push({
      name: "separator4",
      data: "",
      type: "markdown",
      displayName: "Separator",
      description: "---",
    });

    pluginData.push({
      name: "separator5",
      data: "",
      type: "markdown",
      displayName: "Separator",
      description: `# 插件日志`,
      t_description: {
        zh_cn: `# 插件日志
插件能够创建日志文件以帮助调试和记录操作。日志文件存储在模组源目录的上一级目录中，名为 **modStatusKeeper.log**。`,
        en: `# Plugin Log
The plugin is able to create log files to assist with debugging and recording operations. Log files are stored in the parent directory of the mod source directory, named **modStatusKeeper.log**.`,
      },
    });

    /**
     * [CUSTOM FEATURE] - Open Log File Button
     * Opens the log file in the default text editor for viewing
     */
    pluginData.push({
      name: "openLogButton",
      data: "",
      type: "iconbutton",
      displayName: "Open Log File",
      t_displayName: {
        zh_cn: "打开日志文件",
        en: "Open Log File",
      },
      buttonName: "open", // Icon identifier
      t_buttonName: {
        zh_cn: "打开",
        en: "Open",
      },
      /**
       * Open log file operation handler
       * Opens the log file in the default system text editor
       */
      onChange: async () => {
        try {
          const logPath = path.join(
            path.resolve(iManager.config.modSourcePath),
            "..",
            "modStatusKeeper.log",
          );

          // Check if log file exists
          if (fs.existsSync(logPath)) {
            // Use child_process to open the file with the default application
            const { exec } = require("node:child_process");

            // Windows command to open file with default application
            exec(`start "" "${logPath}"`, (error) => {
              if (error) {
                console.error("Failed to open log file:", error);
                iManager.t_snack(
                  {
                    en: `Failed to open log file: ${error.message}`,
                    zh_cn: `打开日志文件失败：${error.message}`,
                  },
                  "error",
                );
              } else {
                iManager.t_snack(
                  {
                    en: "Log file opened in default text editor",
                    zh_cn: "日志文件已在默认文本编辑器中打开",
                  },
                  "success",
                );
              }
            });
          } else {
            iManager.t_snack(
              {
                en: "No log file found to open. Enable logging first.",
                zh_cn: "未找到要打开的日志文件。请先启用日志记录。",
              },
              "info",
            );
          }
        } catch (error) {
          console.error("Failed to open log file:", error);
          iManager.t_snack(
            {
              en: `Failed to open log file: ${error.message}`,
              zh_cn: `打开日志文件失败：${error.message}`,
            },
            "error",
          );
        }
      },
    });

    // Add logging controls to plugin data
    pluginData.push(loggingEnabled);

    /**
     * [CUSTOM FEATURE] - Clear Log Button
     * Deletes the current log file to free up space
     */
    pluginData.push({
      name: "clearLogButton",
      data: "",
      type: "iconbutton",
      displayName: "Clear Log File",
      t_displayName: {
        zh_cn: "清除日志文件",
        en: "Clear Log File",
      },
      buttonName: "clear", // Icon identifier
      t_buttonName: {
        zh_cn: "清除",
        en: "Clear",
      },
      /**
       * Clear log file operation handler
       * Deletes the current log file and recreates it
       */
      onChange: async () => {
        try {
          const logPath = path.join(
            path.resolve(iManager.config.modSourcePath),
            "..",
            "modStatusKeeper.log",
          );

          // Check if log file exists
          if (fs.existsSync(logPath)) {
            // Delete the current log file
            fs.unlinkSync(logPath);

            // Reinitialize logging if it's enabled
            if (loggingEnabled.data) {
              initFileLogging(logPath);
              log("Log file cleared and reinitialized");
            } else {
              logFile = null; // Disable file logging
            }

            iManager.t_snack(
              {
                en: "Log file cleared successfully",
                zh_cn: "日志文件已成功清除",
              },
              "success",
            );
          } else {
            iManager.t_snack(
              {
                en: "No log file found to clear",
                zh_cn: "未找到要清除的日志文件",
              },
              "info",
            );
          }
        } catch (error) {
          console.error("Failed to clear log file:", error);
          iManager.t_snack(
            {
              en: `Failed to clear log file: ${error.message}`,
              zh_cn: `清除日志文件失败：${error.message}`,
            },
            "error",
          );
        }
      },
    });

    // ==================== LOGGING MANAGEMENT MODULE END ====================

    /**
     * File watcher instance for monitoring d3dx_user.ini changes
     * @type {fs.FSWatcher|null}
     */
    let fileWatcher = null;

    /**
     * Periodic sync timer instance for forced sync every 5 seconds
     * @type {NodeJS.Timeout|null}
     */
    let periodicSyncTimer = null;

    const getD3dxUserPath = () => {
      const defaultPath = d3dxUserIniPath.data;
      if (!defaultPath) {
        log(
          "d3dx_user.ini path is not set, attempting to find it automatically...",
          "WARNING",
        );
      }
      if (defaultPath && fs.existsSync(defaultPath)) {
        return defaultPath;
      }
      // 如果不存在，则尝试利用 iManager.config.modSourcePath 或者 iManager.config.modTargetPath 构建路径
      const tryPaths = [
        path.join(
          path.resolve(iManager.config.modTargetPath),
          "..",
          "d3dx_user.ini",
        ),
        path.join(
          path.resolve(iManager.config.modSourcePath),
          "..",
          "XXMI",
          "ZZMI",
          "d3dx_user.ini",
        ),
      ];
      for (const p of tryPaths) {
        //debug
        log(`Checking for d3dx_user.ini at: ${p}`);
        if (fs.existsSync(p)) {
          // Once we find a valid path, we can return it immediately
          log(`Found d3dx_user.ini at: ${p}`);
          // Set it to d3dxUserPath
          // d3dxUserIniPath.data = p; // Update the path in the plugin data
          iManager.setPluginData(pluginName, d3dxUserIniPath.name, p);
          return p;
        }
      }
      log(
        `d3dx_user.ini not found at any expected location: ${tryPaths.join(", ")}`,
        "ERROR",
      );
      iManager.t_snack(
        {
          en: "d3dx_user.ini not found at any expected location, please set the path manually",
          zh_cn: "在任何预期位置未找到d3dx_user.ini，请手动设置路径",
        },
        "error",
      );
      return null;
    };

    /**
     * Start monitoring d3dx_user.ini for changes
     * Automatically triggers sync when the file is modified
     * @returns {void}
     */
    const startWatcher = () => {
      if (fileWatcher) return; // Already watching

      // Use consistent path construction with parsePersistentVariables
      const d3dxUserPath = getD3dxUserPath();
      log(`Starting file watcher for: ${d3dxUserPath}`);

      if (!fs.existsSync(d3dxUserPath)) {
        log(`d3dx_user.ini not found for watcher at: ${d3dxUserPath}`, "ERROR");
        iManager.t_snack(
          {
            en: "d3dx_user.ini not found at expected location",
            zh_cn: "在预期位置未找到d3dx_user.ini文件",
          },
          "warning",
        );
        return;
      }

      try {
        fileWatcher = fs.watchFile(
          d3dxUserPath,
          { interval: 2000 },
          async (curr, prev) => {
            if (curr.mtime > prev.mtime) {
              log("d3dx_user.ini changed, triggering auto-sync...");

              // Use setTimeout to make sync non-blocking
              setTimeout(async () => {
                try {
                  const result = await syncPersistentVariables();
                  let logMessage = `Auto-sync completed: ${result.updateCount} variables in ${result.fileCount} files`;
                  if (result.lodSyncCount > 0) {
                    logMessage += `, ${result.lodSyncCount} LOD files synced`;
                  }
                  log(logMessage);
                } catch (error) {
                  log(`Auto-sync failed: ${error.message}`, "ERROR");
                }
              }, 100); // Small delay to avoid blocking the UI
            }
          },
        );

        log(`✅ File watcher started successfully for: ${d3dxUserPath}`);
      } catch (error) {
        log(`Failed to start file watcher: ${error.message}`, "ERROR");
        iManager.t_snack(
          {
            en: "Failed to start file monitoring",
            zh_cn: "启动文件监控失败",
          },
          "error",
        );
      }
    };

    /**
     * Stop monitoring d3dx_user.ini for changes
     * Cleans up file watcher resources
     * @returns {void}
     */
    const stopWatcher = () => {
      if (fileWatcher) {
        // Use consistent path construction
        const d3dxUserPath = getD3dxUserPath();
        fs.unwatchFile(d3dxUserPath);
        fileWatcher = null;
        log(`✅ File watcher stopped for: ${d3dxUserPath}`);
      }
    };

    /**
     * Start periodic sync timer that runs every 10 seconds
     * Provides forced synchronization as backup to file watcher
     * @returns {void}
     */
    const startPeriodicSync = () => {
      if (periodicSyncTimer) return; // Already running

      log("Starting periodic sync timer (every 10 seconds)...");

      periodicSyncTimer = setInterval(async () => {
        try {
          // Quick check if d3dx_user.ini exists before attempting sync
          const d3dxUserPath = getD3dxUserPath();
          if (!fs.existsSync(d3dxUserPath)) {
            return; // Skip this cycle if file doesn't exist
          }

          // Perform the sync operation
          const result = await syncPersistentVariables();

          // Only log when changes are made to avoid spam
          if (result.updateCount > 0 || result.lodSyncCount > 0) {
            let logMessage = `Periodic sync completed: ${result.updateCount} variables updated in ${result.fileCount} files`;
            if (result.lodSyncCount > 0) {
              logMessage += `, ${result.lodSyncCount} LOD files synced`;
            }
            log(logMessage);
          }
        } catch (error) {
          log(`Periodic sync failed: ${error.message}`, "ERROR");
        }
      }, 10000); // 10 seconds

      log("✅ Periodic sync timer started successfully");
    };

    /**
     * Stop periodic sync timer
     * Cleans up timer resources
     * @returns {void}
     */
    const stopPeriodicSync = () => {
      if (periodicSyncTimer) {
        clearInterval(periodicSyncTimer);
        periodicSyncTimer = null;
        log("✅ Periodic sync timer stopped");
      }
    };

    /**
     * Parse d3dx_user.ini and extract persistent variable mappings
     *
     * Universal parser that handles any mod structure and file organization.
     * Parses lines in format: $\mods\path\to\file.ini\variable = value
     *
     * @returns {Object} Parsed data structure containing:
     *   - allFiles: Complete mapping of all INI files to their variables
     *   - mainFiles: Files that don't contain "_lod" in their name
     *   - lodFiles: Files that contain "_lod" in their name
     * @throws {Error} When d3dx_user.ini file is not found
     */
    const parsePersistentVariables = () => {
      const d3dxUserPath = getD3dxUserPath();

      log(`Looking for d3dx_user.ini at: ${d3dxUserPath}`);

      if (!fs.existsSync(d3dxUserPath)) {
        log(`d3dx_user.ini not found at: ${d3dxUserPath}`, "ERROR");
        throw new Error("d3dx_user.ini not found");
      }

      const content = fs.readFileSync(d3dxUserPath, "utf8");
      log(`Successfully read d3dx_user.ini (${content.length} characters)`);

      const allEntries = {}; // Structure: { filePath: { variable: value } }

      // Universal regex to capture: $\mods\<any path>\<file>.ini\<variable> = <value>
      const lines = content.split("\n");
      log(`Parsing ${lines.length} lines from d3dx_user.ini`);

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith(";")) continue;

        // Universal pattern: $\mods\<path>\<file>.ini\<variable> = <value>
        // This handles ANY depth of nesting and ANY file/folder names
        // Updated regex to capture ANY variable name (not just \w+ which excludes dots, dashes, etc.)
        // NOTE: d3dx_user.ini typically uses lowercase variable names, but we store them as-is
        // and handle case-insensitive matching during sync
        const match = trimmedLine.match(
          /^\$\\mods\\(.+\.ini)\\([^=]+?)\s*=\s*(.+)$/,
        );
        if (match) {
          const [, fullIniPath, varName, value] = match;
          const cleanVarName = varName.trim();

          log(`✅ Parsed: ${fullIniPath} -> ${cleanVarName} = ${value.trim()}`);
          log(`  Relative path from d3dx_user.ini: ${fullIniPath}`);
          log(`  (Will resolve case-insensitively during sync)`);

          // Store the relative path from d3dx_user.ini, not the absolute path
          if (!allEntries[fullIniPath]) {
            allEntries[fullIniPath] = {};
          }
          allEntries[fullIniPath][cleanVarName] = value.trim();
        } else {
          // Only log lines that look like they should be variable patterns
          if (trimmedLine.includes("$\\mods\\") && trimmedLine.includes("=")) {
            log(`⚠️ Line didn't match pattern: ${trimmedLine}`, "WARN");
          }
        }
      }

      log(
        `Parsing complete: Found ${Object.keys(allEntries).length} files with persistent variables`,
      );
      return allEntries;
    };

    /**
     * Extract [Constants] section from an INI file
     *
     * @param {string} iniPath - Path to the INI file
     * @returns {Object|null} Object with constants key-value pairs, or null if not found
     */
    const extractConstantsSection = (iniPath) => {
      if (!fs.existsSync(iniPath)) {
        log(`File not found: ${iniPath}`, "WARN");
        return null;
      }

      const content = fs.readFileSync(iniPath, "utf8");
      const lines = content.split(/\r?\n/);
      const constants = {};
      let inConstantsSection = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check for section headers
        if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
          const sectionName = trimmedLine.slice(1, -1).trim();
          inConstantsSection = sectionName.toLowerCase() === "constants";
          continue;
        }

        // If we're in [Constants] section, parse key-value pairs
        if (inConstantsSection && trimmedLine && !trimmedLine.startsWith(";")) {
          const match = trimmedLine.match(/^(.+?)\s*=\s*(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            constants[key] = value;
          }
        }
      }

      return Object.keys(constants).length > 0 ? constants : null;
    };

    /**
     * Update [Constants] section in an INI file
     *
     * @param {string} iniPath - Path to the INI file
     * @param {Object} constants - Object with constants key-value pairs to update
     * @returns {boolean} True if file was modified
     */
    const updateConstantsSection = (iniPath, constants) => {
      if (!fs.existsSync(iniPath)) {
        log(`File not found: ${iniPath}`, "WARN");
        return false;
      }

      const content = fs.readFileSync(iniPath, "utf8");
      const lines = content.split(/\r?\n/);
      const newLines = [];
      let inConstantsSection = false;
      let constantsSectionFound = false;
      let constantsWereUpdated = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check for section headers
        if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
          const sectionName = trimmedLine.slice(1, -1).trim();

          // If we were in Constants section and it's ending, add our constants
          if (inConstantsSection) {
            for (const [key, value] of Object.entries(constants)) {
              newLines.push(`${key} = ${value}`);
              constantsWereUpdated = true;
            }
            inConstantsSection = false;
          }

          // Check if this is the Constants section
          if (sectionName.toLowerCase() === "constants") {
            inConstantsSection = true;
            constantsSectionFound = true;
            newLines.push(line);
            // Skip existing constants - we'll replace them all
            continue;
          }
        }

        // Skip existing constants in the [Constants] section
        if (
          inConstantsSection &&
          trimmedLine &&
          !trimmedLine.startsWith(";") &&
          trimmedLine.includes("=")
        ) {
          continue; // Skip existing constant definitions
        }

        newLines.push(line);
      }

      // If we were in Constants section at end of file, add our constants
      if (inConstantsSection) {
        for (const [key, value] of Object.entries(constants)) {
          newLines.push(`${key} = ${value}`);
          constantsWereUpdated = true;
        }
      }

      // If no [Constants] section was found, add one
      if (!constantsSectionFound && Object.keys(constants).length > 0) {
        newLines.push("");
        newLines.push("[Constants]");
        for (const [key, value] of Object.entries(constants)) {
          newLines.push(`${key} = ${value}`);
          constantsWereUpdated = true;
        }
      }

      if (constantsWereUpdated) {
        const newContent = newLines.join("\n");
        fs.writeFileSync(iniPath, newContent, "utf8");
        log(`✅ Updated [Constants] section in ${path.basename(iniPath)}`);
        return true;
      }

      return false;
    };

    /**
     * Update persistent variables in mod INI files
     *
     * Implements the core sync logic:
     * 1. Updates main INI files directly with their values from d3dx_user.ini
     * 2. After updating each main file, immediately syncs its [Constants] section
     *    to all LOD files in the same directory
     *
     * Variable update patterns supported:
     * - global persist $varname = value
     * - $varname = value
     *
     * @returns {Promise<Object>} Statistics about the sync operation:
     *   - updateCount: Number of variables updated
     *   - fileCount: Number of files modified
     *   - lodSyncCount: Number of LOD files updated with [Constants] sections
     */

    /**
     * Update variables in a specific INI file
     *
     * CONSTANTS SECTION ONLY: Only updates variables within the [Constants] section.
     * This prevents breaking key bindings in sections like [Keycolor] that may have
     * the same variable names (e.g., $color) but serve different purposes.
     *
     * @param {string} filePath - Absolute path to the INI file
     * @param {Object} variables - Object with variable names and values to update
     * @returns {Object} Result object with updated flag and update count
     */
    const updateVariablesInFile = (filePath, variables) => {
      if (!fs.existsSync(filePath)) {
        return { updated: false, updateCount: 0 };
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);
      const newLines = [];
      let updateCount = 0;
      let modified = false;
      let inConstantsSection = false;

      // Track which variables we've updated
      const updatedVars = new Set();

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check for section headers
        if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
          const sectionName = trimmedLine.slice(1, -1).toLowerCase();
          inConstantsSection = sectionName === "constants";
          newLines.push(line); // Keep section headers
          continue;
        }

        // Only update variables if we're in the [Constants] section
        if (
          inConstantsSection &&
          trimmedLine &&
          !trimmedLine.startsWith(";") &&
          trimmedLine.includes("$")
        ) {
          // Updated regex to capture ANY variable name (not just \w+ which excludes dots, dashes, etc.)
          // This matches the same pattern used in parsePersistentVariables for consistency
          const match = trimmedLine.match(/^(.*?\$([^=\s]+))\s*=\s*(.*)$/);
          if (match) {
            const fullVarDeclaration = match[1]; // e.g., "global persist $sleeves"
            const varName = match[2]; // e.g., "sleeves"
            const currentValue = match[3].trim(); // current value

            // Check if we need to update this variable (case-insensitive matching)
            // This handles the fact that d3dx_user.ini uses lowercase variable names
            // while mod INI files may use camelCase or other naming conventions
            const matchingVarKey = Object.keys(variables).find(
              (key) => key.toLowerCase() === varName.toLowerCase(),
            );
            if (matchingVarKey) {
              const newValue = variables[matchingVarKey];
              if (currentValue !== newValue) {
                newLines.push(`${fullVarDeclaration} = ${newValue}`);
                updateCount++;
                modified = true;
                log(
                  `✅ Updated ${varName}: ${currentValue} → ${newValue} in ${path.basename(filePath)} [Constants]`,
                );
              } else {
                newLines.push(line); // Keep existing line
              }
              updatedVars.add(varName);
            } else {
              newLines.push(line); // Keep existing line - not a variable we need to update
            }
            continue;
          }
        }

        // Keep all other lines unchanged
        newLines.push(line);
      }

      // Write the file if modified
      if (modified) {
        const newContent = newLines.join("\n");
        fs.writeFileSync(filePath, newContent, "utf8");
      }

      return { updated: modified, updateCount };
    };

    /**
     * DIRECT TRANSLATION SYNC - No patterns, no guessing, no assumptions
     *
     * d3dx_user.ini tells us exactly what to do:
     * $\mods\path\to\file.ini\variable = value
     *
     * ALGORITHM:
     * 1. Parse all entries from d3dx_user.ini
     * 2. Update ONLY main files (skip LOD files completely during variable updates)
     * 3. Sync [Constants] sections from updated main files to all LOD files in same directory
     * 4. LOD files get their values ONLY from [Constants] sync, never from direct d3dx_user.ini updates
     *
     * This prevents LOD files from being overwritten by d3dx_user.ini values and ensures
     * they only receive properly synced [Constants] sections from their main files.
     *
     * OPTIMIZED FOR PERFORMANCE:
     * - Reduced logging to minimize I/O operations
     * - Batch processing with yield points
     * - Early exit on no changes
     *
     * @returns {Promise<Object>} Statistics about the sync operation
     */
    const syncPersistentVariables = async () => {
      const allEntries = parsePersistentVariables();

      // Early exit if no entries to process
      if (Object.keys(allEntries).length === 0) {
        return { updateCount: 0, fileCount: 0 };
      }

      let updateCount = 0;
      let fileCount = 0;
      let processedCount = 0;
      const totalFiles = Object.keys(allEntries).length;

      /**
       * Optimized path resolver with caching
       * Resolves file paths case-insensitively to handle differences between
       * d3dx_user.ini paths and actual filesystem paths
       */
      const pathCache = new Map();
      const resolvePath = (d3dxPath) => {
        // Check cache first
        if (pathCache.has(d3dxPath)) {
          return pathCache.get(d3dxPath);
        }

        try {
          const modSourcePath = path.resolve(iManager.config.modSourcePath);
          let currentPath = modSourcePath;
          const pathParts = d3dxPath.split("\\").filter((part) => part);

          // Traverse path parts case-insensitively
          for (const part of pathParts) {
            if (fs.existsSync(currentPath)) {
              const items = fs.readdirSync(currentPath);
              // Case-insensitive matching for cross-platform compatibility
              const found = items.find(
                (item) => item.toLowerCase() === part.toLowerCase(),
              );
              if (found) {
                currentPath = path.join(currentPath, found);
              } else {
                pathCache.set(d3dxPath, null);
                return null;
              }
            } else {
              pathCache.set(d3dxPath, null);
              return null;
            }
          }

          pathCache.set(d3dxPath, currentPath);
          return currentPath;
        } catch (_error) {
          pathCache.set(d3dxPath, null);
          return null;
        }
      };

      // OPTIMIZED DIRECT TRANSLATION: Process in batches with yield points
      // Track main files that were updated for LOD syncing
      const updatedMainFiles = [];

      for (const [d3dxPath, variables] of Object.entries(allEntries)) {
        processedCount++;

        // Yield control every 5 files to prevent UI blocking
        if (processedCount % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }

        // Resolve the actual file path case-insensitively
        const actualPath = resolvePath(d3dxPath);
        if (!actualPath || !fs.existsSync(actualPath)) {
          continue;
        }

        // Check if this is a LOD file - if so, skip direct variable updates
        // LOD files should only be updated through [Constants] syncing from main files
        const isLodFile = path
          .basename(actualPath)
          .toLowerCase()
          .includes("_lod");
        if (isLodFile) {
          log(
            `Skipping LOD file ${path.basename(actualPath)} - will be updated via [Constants] sync from main file`,
          );
          continue; // Skip LOD files during main variable update phase
        }

        // Update variables in this main file only
        const result = updateVariablesInFile(actualPath, variables);
        if (result.updated) {
          fileCount++;
          updateCount += result.updateCount;

          // Track this main file for LOD syncing
          updatedMainFiles.push(actualPath);
        }
      }

      // STEP 2: Sync [Constants] sections from updated main files to their LOD files
      // NOTE: LOD files are named by character mod name (e.g., Astra_lod1.ini, Koleda_lod1.ini)
      // Main INI file name doesn't matter - we sync ALL LOD files in the same directory
      let lodSyncCount = 0;
      if (updatedMainFiles.length > 0) {
        log(
          `Starting LOD sync for ${updatedMainFiles.length} updated main files...`,
        );
      }

      for (const mainFilePath of updatedMainFiles) {
        // Extract [Constants] section from the main file
        const constants = extractConstantsSection(mainFilePath);
        if (!constants || Object.keys(constants).length === 0) {
          log(
            `No [Constants] section found in ${path.basename(mainFilePath)}, skipping LOD sync`,
          );
          continue; // Skip if no constants to sync
        }

        log(
          `Found ${Object.keys(constants).length} constants in ${path.basename(mainFilePath)}`,
        );

        // Find all LOD files in the same directory
        const mainDir = path.dirname(mainFilePath);

        try {
          const dirItems = fs.readdirSync(mainDir);
          const lodFiles = dirItems.filter((item) => {
            const itemLower = item.toLowerCase();

            // Must be an INI file and contain "_lod"
            if (!itemLower.endsWith(".ini") || !itemLower.includes("_lod")) {
              return false;
            }

            // LOD files are named by character mod name (e.g., Astra_lod1.ini, Koleda_lod1.ini)
            // Main INI file name doesn't matter - we sync ALL LOD files in the same directory
            // This is because LOD files are always character-specific regardless of main file naming
            return true;
          });

          if (lodFiles.length === 0) {
            log(`No LOD files found in directory: ${path.basename(mainDir)}`);
          } else {
            log(
              `Found ${lodFiles.length} LOD files in directory: ${lodFiles.join(", ")}`,
            );
          }

          // Sync constants to each LOD file
          for (const lodFile of lodFiles) {
            const lodFilePath = path.join(mainDir, lodFile);
            if (updateConstantsSection(lodFilePath, constants)) {
              lodSyncCount++;
              log(
                `🔄 Synced [Constants] from ${path.basename(mainFilePath)} to ${lodFile}`,
              );
            } else {
              log(`Failed to sync [Constants] to ${lodFile}`, "WARN");
            }
          }
        } catch (error) {
          log(
            `Failed to sync LOD files for ${path.basename(mainFilePath)}: ${error.message}`,
            "WARN",
          );
        }
      }

      // Only log summary for significant changes
      if (updateCount > 0 || lodSyncCount > 0) {
        log(
          `🎯 Sync complete: ${updateCount} variables updated in ${fileCount}/${totalFiles} main files`,
        );
        if (lodSyncCount > 0) {
          log(
            `🔄 LOD sync complete: ${lodSyncCount} LOD files updated with [Constants] sections`,
          );
        }
        // Count how many files were skipped as LOD files
        const lodFilesSkipped = totalFiles - fileCount;
        if (lodFilesSkipped > 0) {
          log(
            `⏭️ Skipped ${lodFilesSkipped} LOD files (updated via [Constants] sync only)`,
          );
        }
      }

      return { updateCount, fileCount, lodSyncCount };
    };

    // Register cleanup handler for when plugin is disabled or reloaded
    // Ensures file watcher and periodic sync are properly stopped to prevent memory leaks
    iManager.on("pluginDisabled", (disabledPluginName) => {
      if (disabledPluginName !== pluginName) return;
      stopWatcher();
      stopPeriodicSync();
    });

    // ==================== CUSTOM UPDATER MODULE END ====================

    // ==================== BARE MINIMUM REQUIREMENTS START ====================
    /**
     * [REQUIRED] - Register all plugin components with the mod manager
     * This makes the plugin UI visible in the settings
     */
    iManager.registerPluginConfig(pluginName, pluginData);

    // ==================== INITIALIZATION LOGIC ====================
    /**
     * Initialize auto-watcher if toggle is already enabled
     * This handles the case where the plugin loads with auto-updater already on
     */
    iManager.on("pluginLoaded", () => {
      log("Checking if auto-updater should start on plugin load...");
      if (autoUpdater.data === true) {
        log("Auto-updater toggle is enabled, checking d3dx_user.ini path...");
        // Ensure d3dx_user.ini path is set
        if (!d3dxUserIniPath.data) {
          log("d3dx_user.ini path is not set, attempting to resolve...");
          const resolvedPath = getD3dxUserPath();
          if (!resolvedPath) {
            log(
              "Failed to resolve d3dx_user.ini path, cannot start auto-updater",
              "ERROR",
            );
            iManager.t_snack(
              {
                en: "Auto-updater failed to start: d3dx_user.ini path could not be resolved.",
                zh_cn: "自动更新器启动失败：无法解析 d3dx_user.ini 路径。",
              },
              "error",
            );

            // 关闭开启状态
            iManager.setPluginData(pluginName, "autoUpdater", false);
            return; // Exit if path cannot be resolved
          }
        }
        log("Auto-updater toggle is enabled, starting file watcher...");

        // Check backup requirements
        if (!backupOverride.data && !hasBackupFiles()) {
          log(
            "Auto-updater enabled but no backups found and override disabled",
            "WARN",
          );
          iManager.t_snack(
            {
              en: "Auto-updater was enabled but no backup files found. Please create backups or enable backup override.",
              zh_cn:
                "自动更新器已启用但未找到备份文件。请创建备份或启用备份覆盖。",
            },
            "warning",
          );
        } else {
          // Start the watcher and periodic sync
          startWatcher();
          startPeriodicSync();

          if (backupOverride.data) {
            log(
              "Auto-updater started on plugin load WITHOUT backup protection",
            );
            iManager.t_snack(
              {
                en: "⚠️ Auto-updater started WITHOUT backup protection. File monitoring active ONLY while manager is running (stops when closed/sleeping)...",
                zh_cn:
                  "⚠️ 自动更新器已启动且无备份保护。管理器运行时文件监控处于活动状态...",
              },
              "warning",
            );
          } else {
            log("Auto-updater started on plugin load with backup protection");
            iManager.t_snack({
              en: "Auto-updater started. File monitoring active ONLY while manager is running (stops when closed/sleeping)...",
              zh_cn: "自动更新器已启动。管理器运行时文件监控处于活动状态...",
            });
          }
        }
      } else {
        log("Auto-updater toggle is disabled, no file watcher needed");
      }
    });
    // ==================== INITIALIZATION LOGIC END ====================
  }, // [REQUIRED] - End of init function
}; // [REQUIRED] - End of module.exports
