// classManager.ts — createClassManager() 工厂函数
//
// 管理匹配指定 CSS class 的 DOM 元素生命周期：
// - 自动发现（querySelectorAll）
// - 追踪新增/移除
// - 每帧回调 onUpdate
// - 通过 AbortSignal 或 destroy() 清理
//
// 纯浏览器 API，无框架依赖。

export interface ClassManagerOptions {
  /** 要监听的 CSS class 名称（不含点前缀） */
  className: string;
  /** 新元素出现时回调 */
  onInit?: (el: HTMLElement) => void;
  /** 元素从 DOM 中移除（或不再匹配 class）时回调 */
  onDestroy?: (el: HTMLElement) => void;
  /** 每帧回调，参数为当前匹配的元素数组 */
  onUpdate?: (items: Readonly<HTMLElement[]>) => void;
  /** 外部 AbortSignal，触发后销毁 */
  signal?: AbortSignal;
}

export interface ClassManager {
  /** 手动触发 DOM 重新扫描 */
  refresh(): void;
  /** 销毁：停止 RAF 循环，清空元素追踪 */
  destroy(): void;
  /** 当前匹配的元素（只读） */
  readonly items: Readonly<HTMLElement[]>;
}

/**
 * 创建 CSS class 元素管理器。
 *
 * 每个实例独立运行自己的 requestAnimationFrame 循环。
 * 适合少量实例（3-5 个）的场景；大量使用时可考虑共享调度器。
 */
export function createClassManager(options: ClassManagerOptions): ClassManager {
  const { className, onInit, onDestroy, onUpdate, signal } = options;

  let items: HTMLElement[] = [];
  let destroyed = false;
  let rafId = 0;
  let hasBuilt = false;

  /** 扫描 DOM，对比变化，触发 init/destroy 回调 */
  function refresh(): void {
    if (destroyed) return;

    const newItems = Array.from(
      document.querySelectorAll<HTMLElement>(`.${className}`),
    );

    // 找出移除的元素（在旧列表但不在新列表）
    const removed = items.filter((el) => !newItems.includes(el));

    // 找出新增的元素（在新列表但不在旧列表）
    const added = newItems.filter((el) => !items.includes(el));

    // 更新列表
    items = newItems;

    // 触发回调
    for (const el of removed) {
      onDestroy?.(el);
    }
    for (const el of added) {
      onInit?.(el);
    }
  }

  /** RAF 循环 */
  function tick(): void {
    if (destroyed) return;

    if (!hasBuilt) {
      // 首次执行：扫描 DOM
      refresh();
      hasBuilt = true;
    }

    if (items.length > 0 && onUpdate) {
      onUpdate(items);
    }

    rafId = requestAnimationFrame(tick);
  }

  // 启动
  rafId = requestAnimationFrame(tick);

  // AbortSignal
  if (signal) {
    signal.addEventListener("abort", () => destroy(), { once: true });
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(rafId);

    // 对所有元素触发 destroy 回调
    for (const el of items) {
      onDestroy?.(el);
    }
    items = [];
  }

  return {
    refresh,
    destroy,
    get items(): Readonly<HTMLElement[]> {
      return items;
    },
  };
}
