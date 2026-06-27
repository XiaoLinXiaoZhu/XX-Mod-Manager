// types.ts — 共享类型：LangRef

import type { Ref, ComputedRef } from "vue";
import type { Language } from "@xxmm/i18n";

/** Vue 响应式语言引用：Ref 或 ComputedRef */
export type LangRef = Ref<Language> | ComputedRef<Language>;
