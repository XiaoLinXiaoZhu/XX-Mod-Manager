// PathUtil.ts — 纯字符串路径操作（替代 node:path 的渲染进程使用）
//
// 仅包含纯字符串操作，不访问文件系统。文件系统操作请使用 IPC fs channels。

/** 拼接路径段。始终使用 / 分隔（Windows 兼容）。 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter((s) => s !== "" && s !== undefined)
    .map((s) => s.replace(/\\/g, "/"))
    .join("/")
    .replace(/\/+/g, "/");
}

/** 返回路径最后一段（等价于 path.basename）。 */
export function basename(p: string): string {
  const normalized = p.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((s) => s !== "");
  return parts[parts.length - 1] ?? "";
}

/** 检查文件名是否以指定前缀开头。 */
export function startsWith(p: string, prefix: string): boolean {
  return basename(p).startsWith(prefix);
}

/** 移除文件名的指定前缀，返回新路径。 */
export function stripPrefix(p: string, prefix: string): string {
  const normalized = p.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : "";
  const name = basename(p);
  const newName = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  return dir ? `${dir}/${newName}` : newName;
}

/** 给文件名添加前缀，返回新路径。 */
export function addPrefix(p: string, prefix: string): string {
  const normalized = p.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : "";
  const name = basename(p);
  return dir ? `${dir}/${prefix}${name}` : `${prefix}${name}`;
}
