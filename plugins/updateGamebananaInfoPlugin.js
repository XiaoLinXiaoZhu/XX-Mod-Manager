const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const pluginName = "updateGamebananaInfoPlugin";

// Helper function to fetch HTML content from URL
const fetchHtml = async (url) => {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => resolve(data));
			})
			.on("error", reject);
	});
};

// Extract category from HTML content using various patterns
const getCategoryFromHtml = (htmlContent) => {
	const patterns = [
		/<module id="CategoryModule"[^>]*>.*?<div class="Content"><a class="Cluster"[^>]*><img [^>]+><span>([^<]+)<\/span><\/a><\/div><\/module>/,
		/<dt>Super-category<\/dt><dd><a class="Cluster[^"]*" href="[^"]+"><img [^>]+><span>([^<]+)<\/span><\/a><\/dd>/,
		/<a class="Cluster[^"]*" href="https:\/\/gamebanana.com\/mods\/cats\/[^"]+"><img [^>]+><span>([^<]+)<\/span><\/a>/,
		/"gameCategory":\s*"([^"]+)"/,
		/itemListElement":\[.*?"name":"Mods".*?"name":"([^"]+)"/,
	];

	for (const pattern of patterns) {
		const match = htmlContent.match(pattern);
		if (match) return match[1];
	}
	return "";
};

// Extract author from HTML content using various patterns
const getAuthorFromHtml = (htmlContent) => {
	console.log("Attempting to extract author from HTML...");

	const patterns = [
		// Primary patterns for modern GameBanana
		/<a class="Uploader[^"]*" href="[^"]+">([^<]+)<\/a>/,
		/<span class="UserName[^"]*">([^<]+)<\/span>/,
		/<a class="UserName[^"]*" href="[^"]+">([^<]+)<\/a>/,

		// JSON-LD metadata pattern
		/"author":\s*{\s*"@type":\s*"Person",\s*"name":\s*"([^"]+)"/,
		/"author":\s*"([^"]+)"/,

		// Additional modern patterns
		/<div class="Uploader[^"]*">.*?<a[^>]*>([^<]+)<\/a>/,
		/<div class="AuthorName[^"]*">.*?<a[^>]*>([^<]+)<\/a>/,
		/<meta name="author" content="([^"]+)"/,

		// Legacy patterns
		/<a class="Uploader[^"]*" href="[^"]+">([^<]+)<\/a>/,
		/<div[^>]*class="[^"]*UserName[^"]*"[^>]*>([^<]+)<\/div>/,
		/<a[^>]*class="[^"]*UserLink[^"]*"[^>]*>([^<]+)<\/a>/,
	];

	for (const pattern of patterns) {
		const match = htmlContent.match(pattern);
		if (match) {
			console.log("Found author using pattern:", pattern);
			console.log("Extracted author:", match[1].trim());
			return match[1].trim();
		}
	}

	// Try to find in JSON-LD metadata with more detailed logging
	const jsonLdPattern =
		/<script type="application\/ld\+json">(.*?)<\/script>/gs;
	let match;
	while ((match = jsonLdPattern.exec(htmlContent)) !== null) {
		try {
			console.log("Found JSON-LD data, attempting to parse...");
			const data = JSON.parse(match[1]);
			if (data.author) {
				console.log("Found author in JSON-LD:", data.author);
				if (typeof data.author === "object" && data.author.name) {
					console.log("Extracted author name from object:", data.author.name);
					return data.author.name;
				} else if (typeof data.author === "string") {
					console.log("Extracted author string:", data.author);
					return data.author;
				}
			}
		} catch (e) {
			console.log("Error parsing JSON-LD:", e.message);
		}
	}

	// If no author found, log a sample of the HTML for debugging
	console.log("No author found. HTML sample:", htmlContent.substring(0, 500));
	return null;
};

module.exports = {
	name: pluginName,
	t_displayName: {
		zh_cn: "更新GameBanana信息",
		en: "Update GameBanana Info",
	},
	init(iManager) {
		const pluginData = [];

		pluginData.push({
			name: "info",
			type: "markdown",
			description: "Info",
			t_description: {
				zh_cn: `感谢 [Jank8](https://github.com/Jank8) 对该插件的贡献
# GameBanana Mod 信息更新器
# 它如何工作？
通过从 GameBanana 获取最新的 mod 分类和作者信息，并将它们设置mod的信息中。
---`,
				en: `Thanks to [Jank8](https://github.com/Jank8) for contributing to this plugin
# GameBanana Mod Info Updater
# How does it work?
By fetching the latest mod category and author information from GameBanana and setting them in the mod's info.
---`,
			},
		});

		// Configuration options
		pluginData.push({
			name: "updateCategories",
			data: true,
			type: "boolean",
			displayName: "Update Categories",
			description:
				"When enabled: Updates mod categories from GameBanana. When disabled: Skips category updates",
			t_displayName: {
				zh_cn: "更新分类",
				en: "Update Categories",
			},
			t_description: {
				zh_cn: "开启时：从GameBanana更新mod分类。关闭时：跳过分类更新",
				en: "When enabled: Updates mod categories from GameBanana. When disabled: Skips category updates",
			},
		});

		pluginData.push({
			name: "updateAuthors",
			data: true,
			type: "boolean",
			displayName: "Update Authors",
			description:
				"When enabled: Updates mod authors from GameBanana. When disabled: Skips author updates",
			t_displayName: {
				zh_cn: "更新作者",
				en: "Update Authors",
			},
			t_description: {
				zh_cn: "开启时：从GameBanana更新mod作者。关闭时：跳过作者更新",
				en: "When enabled: Updates mod authors from GameBanana. When disabled: Skips author updates",
			},
		});

		pluginData.push({
			name: "onlyUpdateUnknown",
			data: true,
			type: "boolean",
			displayName: "Smart Update Mode",
			description:
				"When enabled: Only updates missing/unknown values. When disabled: Forces update of all selected fields",
			t_displayName: {
				zh_cn: "智能更新模式",
				en: "Smart Update Mode",
			},
			t_description: {
				zh_cn: "开启时：仅更新缺失/未知的值。关闭时：强制更新所有已选字段",
				en: "When enabled: Only updates missing/unknown values. When disabled: Forces update of all selected fields",
			},
		});

		// Divider
		pluginData.push({
			name: "divider1",
			data: "",
			type: "markdown",
			displayName: "Divider",
			description: "---",
		});

		// Update confirmation switch
		const confirmUpdate = {
			name: "confirmUpdate",
			data: false,
			type: "boolean",
			displayName: "Safety Lock",
			description:
				"Step 1: Enable this safety lock. Step 2: Click update button. Lock auto-disables after update",
			t_displayName: {
				zh_cn: "安全锁",
				en: "Safety Lock",
			},
			t_description: {
				zh_cn: "第1步：启用此安全锁。第2步：点击更新按钮。更新后安全锁自动关闭",
				en: "Step 1: Enable this safety lock. Step 2: Click update button. Lock auto-disables after update",
			},
			onChange: (value) => {
				confirmUpdate.data = value;
				if (value) {
					iManager.t_snack({
						en: "Safety lock enabled. Click the update button to start.",
						zh_cn: "安全锁已启用。点击更新按钮开始。",
					});
				}
			},
		};
		pluginData.push(confirmUpdate);

		// Update button
		pluginData.push({
			name: "updateButton",
			data: "",
			type: "iconbutton",
			displayName: "Start Update",
			description:
				"Get latest information from GameBanana (requires safety lock)",
			t_displayName: {
				zh_cn: "开始更新",
				en: "Start Update",
			},
			t_description: {
				zh_cn: "从GameBanana获取最新信息（需要启用安全锁）",
				en: "Get latest information from GameBanana (requires safety lock)",
			},
			buttonName: "sync",
			t_buttonName: {
				zh_cn: "更新",
				en: "Update",
			},
			onChange: async () => {
				if (!confirmUpdate.data) {
					iManager.t_snack(
						{
							en: "Please enable the safety lock first",
							zh_cn: "请先启用安全锁",
						},
						"warning",
					);
					return;
				}

				// Turn off confirmation after starting
				confirmUpdate.data = false;
				iManager.showDialog("loading-dialog");

				const updateCategories = iManager.getPluginData(
					pluginName,
					"updateCategories",
				);
				const updateAuthors = iManager.getPluginData(
					pluginName,
					"updateAuthors",
				);
				const onlyUpdateUnknown = iManager.getPluginData(
					pluginName,
					"onlyUpdateUnknown",
				);

				iManager.t_snack({
					en: "Updating mod information from GameBanana...",
					zh_cn: "正在从GameBanana更新mod信息...",
				});

				let successCount = 0;
				let skipCount = 0;
				let failCount = 0;

				try {
					for (const mod of iManager.data.modList) {
						try {
							// Skip if no valid GameBanana URL
							if (
								!mod.url ||
								mod.url === "" ||
								mod.url === "no url" ||
								mod.url === "unknow" ||
								!mod.url.includes("gamebanana.com")
							) {
								skipCount++;
								continue;
							}

							const htmlContent = await fetchHtml(mod.url);
							let changed = false;

							// Update category if enabled
							if (updateCategories) {
								const needsCategoryUpdate =
									!onlyUpdateUnknown ||
									!mod.category ||
									mod.category === "unknow" ||
									mod.category === "";
								if (needsCategoryUpdate) {
									const category = getCategoryFromHtml(htmlContent);
									if (category) {
										mod.category = category;
										changed = true;
									}
								}
							}

							// Update author if enabled
							if (updateAuthors) {
								const needsAuthorUpdate =
									!onlyUpdateUnknown ||
									!mod.author ||
									mod.author === "unknow" ||
									mod.author === "";
								if (needsAuthorUpdate) {
									const author = getAuthorFromHtml(htmlContent);
									if (author && (!onlyUpdateUnknown || author !== mod.author)) {
										mod.author = author;
										changed = true;
									}
								}
							}

							if (changed) {
								const modFilePath = path.join(
									iManager.config.modSourcePath,
									mod.name,
									"mod.json",
								);
								fs.writeFileSync(modFilePath, JSON.stringify(mod, null, 4));
								successCount++;
							} else {
								skipCount++;
							}
						} catch (error) {
							console.error(`Error processing mod ${mod.name}: `, error);
							failCount++;
						}
					}

					iManager.t_snack(
						{
							en: `Update complete.Success: ${successCount}, Skipped: ${skipCount}, Failed: ${failCount}`,
							zh_cn: `更新完成。成功：${successCount}，跳过：${skipCount}，失败：${failCount}`,
						},
						successCount > 0 ? "success" : "info",
					);
				} catch (error) {
					console.error("Update failed:", error);
					iManager.t_snack(
						{
							en: `Update failed: ${error.message}`,
							zh_cn: `更新失败：${error.message}`,
						},
						"error",
					);
				} finally {
					iManager.dismissDialog("loading-dialog");
					if (successCount > 0) {
						iManager.showDialog("dialog-need-refresh");
					}
				}
			},
		});

		iManager.registerPluginConfig(pluginName, pluginData);
	},
};
