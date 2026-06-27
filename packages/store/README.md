# @xxmm/store

应用级单一响应式数据源。

## 用途

用 `@vue/reactivity` 的 `reactive()` 替代旧架构中 IManager 的三份数据拷贝：

- `_config` / `_data` / `_temp`（实例属性）
- `g_config` / `g_data` / `g_temp`（模块级普通对象）
- `g_config_vue` / `g_data_vue` / `g_temp_vue`（Vue ref 包装）

一份 `reactive()` 对象同时满足 Vue 组件响应式绑定和普通 JS 代码直接读写。

## 决策点

- **`reactive()` 而非 `ref()`**：数据作为整体对象访问（`store.config.language`），不需要 `.value`。代价是不可解构（会丢失响应性），但当前使用模式不支持解构。
- **工厂函数而非单例**：`createAppStore()` 返回新实例，为将来多窗口/测试场景留空间。当前在 IManager.js 模块作用域创建单一实例并导出。

## 待完成

- Vue 组件当前通过 `import { store } from "IManager"` 获取，应改为 `provide/inject` 的 DI 模式。
- `AppData.modList` 类型为 `unknown[]`，未导入 `ModData` 类型以避免循环依赖。可考虑提取共享类型包。
