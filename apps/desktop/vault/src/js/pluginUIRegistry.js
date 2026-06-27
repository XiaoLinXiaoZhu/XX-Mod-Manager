// pluginUIRegistry.js — PluginUIRegistry 渲染进程实现
//
// 提供 ctx.ui 的四个方法：addCss / removeCss / showDialog / dismissDialog
//
// NOTE: 这是极简设计——ctx.ui 只封装纯 DOM 做起来难受的操作。
// 其余 DOM 操作（工具栏按钮、对话框注入、事件绑定）由插件直接用 document 完成。
// 详见 packages/plugin/README.md 中的设计决策说明。
//
// NOTE: showDialog/dismissDialog 是 <dialog> 元素的薄封装。
// 调用者需确保 dialogId 对应的 <dialog> 元素存在，否则静默失败并 warn。
// 这是因为插件可能在 DOM 就绪前注册——由插件自行保证调用时机。

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * 创建一个 PluginUIRegistry 实例。
 * 每个插件应获得独立的实例（虽然当前实现是无状态的，但保留扩展空间）。
 */
export function createPluginUIRegistry() {
  return {
    /**
     * 注入 CSS，基于内容哈希自动去重。
     * NOTE: 哈希去重意味着同一段 CSS 多次调用只创建一个 <style> 元素。
     * 这消除了旧版插件中"先 remove 再 add 来更新"的繁琐模式——
     * 直接再调一次 addCss 即可，哈希相同则无操作。
     * @param {string} css - CSS 文本
     * @returns {string} id - 用于后续 removeCss
     */
    addCss(css) {
      const hash = hashCode(css);
      const existing = document.getElementById(hash);
      if (existing) return hash;

      const style = document.createElement("style");
      style.id = hash;
      style.innerHTML = css;
      document.head.appendChild(style);
      return hash;
    },

    /**
     * 移除之前注入的 CSS。
     * @param {string} id - addCss 返回的 id
     */
    removeCss(id) {
      const style = document.getElementById(id);
      if (style) style.remove();
    },

    /**
     * 显示对话框。包装 document.getElementById(id).show()
     * NOTE: 仅支持原生 <dialog> 元素。如果对话框是 Vue 组件或其他自定义实现，
     * 需要对应的 show 机制，此方法不适用。
     * @param {string} dialogId - dialog 元素的 id
     */
    showDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (dialog && typeof dialog.show === "function") {
        dialog.show();
      } else {
        console.warn(
          `[PluginUI] Dialog "${dialogId}" not found or not a <dialog> element`,
        );
      }
    },

    /**
     * 关闭对话框。包装 document.getElementById(id).dismiss()
     * @param {string} dialogId - dialog 元素的 id
     */
    dismissDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (dialog && typeof dialog.dismiss === "function") {
        dialog.dismiss();
      } else {
        console.warn(
          `[PluginUI] Dialog "${dialogId}" not found or not a <dialog> element`,
        );
      }
    },
  };
}
