// extract.ts — i18n 提取脚本骨架
//
// 扫描源码中的 i18n`...` 和 ctx.i18n`...` 调用，提取所有翻译 key。
// 为每个 scope 生成/更新 locales/<targetLang>.json。
//
// 用法（待实现）：
//   bun run packages/i18n/scripts/extract.ts --scope app --defaultLang zh_cn --target en
//   bun run packages/i18n/scripts/extract.ts --plugin plugins/my-plugin --defaultLang en --target zh_cn

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

// ---- 类型 ----

interface ExtractOptions {
  /** 源码目录 */
  sourceDir: string;
  /** defaultLanguage */
  defaultLang: string;
  /** 目标翻译语言 */
  targetLang: string;
  /** 翻译表输出目录 */
  localesDir: string;
}

interface ExtractionResult {
  keys: string[];
  existing: Record<string, string>;
  merged: Record<string, string>;
}

// ---- 提取 ----

/** 从源码中提取所有 i18n`...` 中的静态文本 */
function extractKeys(source: string): string[] {
  // 匹配 i18n`...` 和 ctx.i18n`...` 
  // 只提取静态文本部分，跳过 ${...} 插值
  const pattern = /(?:ctx\.)?i18n`((?:[^`\\]|\\.)*)`/g;
  const keys: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    // 将模板中的 ${...} 替换为 {{}}
    const raw = match[1] ?? "";
    const key = raw.replace(/\$\{[^}]*\}/g, "{{}}");
    keys.push(key);
  }
  return keys;
}

/** 扫描目录中所有 .ts/.tsx 文件 */
function scanDirectory(dir: string): string[] {
  const keys: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const filePath = join(entry.parentPath ?? dir, entry.name);
    const source = readFileSync(filePath, "utf-8");
    keys.push(...extractKeys(source));
  }
  return [...new Set(keys)]; // 去重
}

// ---- 合并 ----

/** 读取已有翻译表 */
function loadExisting(localesDir: string, targetLang: string): Record<string, string> {
  const filePath = join(localesDir, `${targetLang}.json`);
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    console.warn(`Failed to parse ${filePath}, starting fresh`);
    return {};
  }
}

/** 合并新提取的 key 和已有翻译 */
function mergeKeys(
  newKeys: string[],
  existing: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const key of newKeys) {
    merged[key] = existing[key] ?? ""; // 保留已有翻译，新 key 标空
  }
  return merged;
}

// ---- 主流程 ----

function extract(options: ExtractOptions): ExtractionResult {
  const keys = scanDirectory(options.sourceDir);
  const existing = loadExisting(options.localesDir, options.targetLang);
  const merged = mergeKeys(keys, existing);

  // 确保目录存在
  if (!existsSync(options.localesDir)) {
    mkdirSync(options.localesDir, { recursive: true });
  }

  // 写入翻译表
  const outputPath = join(options.localesDir, `${options.targetLang}.json`);
  writeFileSync(outputPath, JSON.stringify(merged, null, 2) + "\n");

  const newCount = keys.filter((k) => !(k in existing)).length;
  const keptCount = keys.filter((k) => k in existing).length;
  const removedCount = Object.keys(existing).filter((k) => !keys.includes(k)).length;

  console.log(`Scope: ${options.sourceDir}`);
  console.log(`  Keys total:  ${keys.length}`);
  console.log(`  New:         ${newCount}`);
  console.log(`  Kept:        ${keptCount}`);
  console.log(`  Removed:     ${removedCount} (stale keys in old translation)`);
  console.log(`  Written to:  ${outputPath}`);

  return { keys, existing, merged };
}

// ---- CLI ----

// TODO: 解析命令行参数
// 当前为骨架，后续接入实际的 CLI 框架或直接通过函数调用使用

export { extract, extractKeys, scanDirectory, mergeKeys, loadExisting };
export type { ExtractOptions, ExtractionResult };
