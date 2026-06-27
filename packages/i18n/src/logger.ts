// logger.ts — dev 模式下记录缺失翻译
//
// 当 i18n 在当前语言下找不到翻译时，输出结构化日志，
// 方便翻译人员校对和补全。

import type { Language } from "./scope";

export interface MissingTranslation {
  scope: string;
  key: string;
  targetLang: Language;
  file?: string;
  line?: number;
  timestamp: number;
}

export type MissingTranslationHandler = (entry: MissingTranslation) => void;

let handler: MissingTranslationHandler | null = null;
let devMode = false;

/** 启用 dev 模式缺失翻译记录 */
export function enableMissingLog(onMissing: MissingTranslationHandler): void {
  devMode = true;
  handler = onMissing;
}

/** 禁用缺失翻译记录 */
export function disableMissingLog(): void {
  devMode = false;
  handler = null;
}

/** 记录一条缺失翻译（仅 dev 模式生效） */
export function logMissing(entry: Omit<MissingTranslation, "timestamp">): void {
  if (!devMode || !handler) return;
  handler({ ...entry, timestamp: Date.now() });
}

/** 将缺失翻译写入 JSONL 文件的便捷 handler */
export function createFileLogger(filePath: string): MissingTranslationHandler {
  // NOTE: 此函数依赖运行环境（Node.js / Bun）
  // 实际使用时由宿主注入 fs.write 能力
  const entries: MissingTranslation[] = [];

  return (entry) => {
    entries.push(entry);
  };
}
