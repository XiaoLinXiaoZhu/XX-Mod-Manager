// @xxmm/i18n-vue — Vue 响应式 i18n 适配层
//
// 将 @xxmm/i18n 的核心能力桥接到 Vue 3 响应式系统：
//   - useScopedI18n(scope, langRef)：组件级 composable
//   - createI18nVue(options)：全局 $t 插件
//
// 用法：
//   // 组件内
//   const { t, $t } = useScopedI18n(scope, langRef);
//   $t`你好 ${name}`            // <script>
//   {{ $t('buttons.save') }}    // <template>
//
//   // 全局
//   app.use(createI18nVue({ scope, langRef }));
//   {{ $t('message.hello') }}   // 任意组件模板

export { useScopedI18n } from "./composable";
export type { ScopedI18n } from "./composable";

export { createI18nVue } from "./plugin";
export type { I18nVuePluginOptions } from "./plugin";

export type { LangRef } from "./types";
