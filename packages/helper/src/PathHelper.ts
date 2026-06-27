// PathHelper.ts — 路径检查工具（简化版）
//
// 移除了 TranslatedText 和 t_snack 依赖。
// CheckDir 现在接收纯字符串 dirName，返回结果码。

import { createClient, IPC } from "@xxmm/ipc";
import { asFilePath, asDirPath } from "@xxmm/types";

const ipc = createClient(IPC);

class PathHelper {
  constructor() {
    throw new Error("PathHelper can't be instantiated");
  }

  /**
   * 检查目录是否存在。返回结果码：
   *   1 = 存在且为目录
   *   0 = dir 为空或非字符串
   *  -1 = 目录不存在
   *  -2 = 路径存在但不是目录
   */
  static async CheckDir(
    dir: string,
    createIfNotExist: boolean = false,
    _dirName: string = "",
  ): Promise<number> {
    if (!dir || typeof dir !== "string") {
      return 0;
    }

    const exists = await ipc.fs.exists(asFilePath(dir));
    if (!exists) {
      if (createIfNotExist) {
        await ipc.fs.mkdir(asDirPath(dir));
        return 1;
      }
      return -1;
    }

    const isDir = await ipc.fs.isDir(asDirPath(dir));
    if (!isDir) {
      return -2;
    }

    return 1;
  }

  /** @deprecated 同步版本——仅兼容旧代码，不要在新代码中使用 */
  static CheckDirSync(
    dir: string,
    _createIfNotExist: boolean = false,
  ): boolean {
    console.warn("PathHelper.CheckDirSync is deprecated — use async CheckDir");
    if (!dir || typeof dir !== "string") {
      return false;
    }
    return true;
  }
}

export { PathHelper };
