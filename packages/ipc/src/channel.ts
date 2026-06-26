// channel.ts — IPC channel 定义（纯类型标签 + 运行时 mode 标记）
//
// 三种通信模式：
//   HandleChannel  — renderer → main (invoke/handle)  请求-响应
//   SendChannel    — renderer → main (send/on)         单向通知
//   PushChannel    — main → renderer (webContents.send) 推送
//
// 短别名：h() = defineHandleChannel, s() = defineSendChannel, p() = definePushChannel

import type { IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent } from "electron";

// ---- channel 接口 ----

export interface HandleChannel<
  Name extends string = string,
  Req extends unknown[] = unknown[],
  Res = unknown,
> {
  readonly name: Name;
  readonly _mode: "handle";
  /** handler 签名（仅类型标注，运行时不存在） */
  readonly _req?: Req;
  readonly _res?: Res;
}

export interface SendChannel<
  Name extends string = string,
  Req extends unknown[] = unknown[],
> {
  readonly name: Name;
  readonly _mode: "send";
  readonly _req?: Req;
}

export interface PushChannel<
  Name extends string = string,
  Req extends unknown[] = unknown[],
> {
  readonly name: Name;
  readonly _mode: "push";
  readonly _req?: Req;
}

/** 任意 channel 类型的并集 */
export type AnyChannel =
  | HandleChannel
  | SendChannel
  | PushChannel;

// ---- handler 类型（便于导出给主进程使用）----

export type HandleHandler<Ch extends HandleChannel> =
  Ch extends HandleChannel<infer _Name, infer Req, infer Res>
    ? (event: IpcMainInvokeEvent, ...args: Req) => Res | Promise<Res>
    : never;

export type SendHandler<Ch extends SendChannel> =
  Ch extends SendChannel<infer _Name, infer Req>
    ? (event: IpcMainEvent, ...args: Req) => void
    : never;

export type PushHandler<Ch extends PushChannel> =
  Ch extends PushChannel<infer _Name, infer Req>
    ? (event: IpcRendererEvent, ...args: Req) => void
    : never;

// ---- channel 工厂函数（短别名）----

/** 定义 invoke/handle 模式的 channel */
export function h<Req extends unknown[], Res>(
  name: string,
): HandleChannel<string, Req, Res> {
  return { name, _mode: "handle" } as HandleChannel<string, Req, Res>;
}

/** 定义 send/on 模式的 channel（渲染→主） */
export function s<Req extends unknown[] = []>(
  name: string,
): SendChannel<string, Req> {
  return { name, _mode: "send" } as SendChannel<string, Req>;
}

/** 定义 push 模式的 channel（主→渲染） */
export function p<Req extends unknown[] = []>(
  name: string,
): PushChannel<string, Req> {
  return { name, _mode: "push" } as PushChannel<string, Req>;
}
