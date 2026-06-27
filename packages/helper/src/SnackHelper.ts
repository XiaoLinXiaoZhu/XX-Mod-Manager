// SnackHelper.ts — snack / t_snack / SnackType 兼容层
//
// TODO: 迁移完成后删除此文件。
// 消费者应改为直接使用 IPC snack channel：
//   snack("msg") → ipc.app.snack("msg")
//   t_snack({zh_cn, en}) → ipc.app.snack(appI18n("key"))
//
// 旧代码使用 snack(msg)、t_snack(msg, type)、SnackType。
// 新架构通过 IPC snack channel 发送通知。
// 此兼容层保留旧的 API 表面，内部使用 IPC。

import { createClient, IPC } from "@xxmm/ipc";
import { appI18n } from "./I18nConfig";
import { TranslatedText } from "./Language";

const ipc = createClient(IPC);

/** Snack 类型（兼容旧的 SnackType 枚举） */
export const SnackType = {
  error: "error",
  info: "info",
  warning: "warning",
} as const;
export type SnackTypeValue = (typeof SnackType)[keyof typeof SnackType];

/** 简单通知（无翻译） */
export function snack(message: string, type: string = "info"): void {
  // IPC snack channel 使用 "warn" 而非 "warning"
  const ipcType = type === "warning" ? "warn" : type;
  ipc.app.snack(message, ipcType);
}

/**
 * 翻译通知。
 *
 * 支持三种调用方式（兼容旧 API）：
 *   t_snack("纯文本")
 *   t_snack({zh_cn: "中文", en: "English"}, "error")
 *   t_snack(translatedTextInstance, "info")
 */
export function t_snack(
  message: string | { zh_cn: string; en: string } | TranslatedText,
  type: string = "info",
): void {
  let text: string;

  if (message instanceof TranslatedText) {
    text = message.get();
  } else if (typeof message === "object") {
    text = appI18n(message.zh_cn);
  } else {
    text = message;
  }

  snack(text, type);
}
