// brand.ts — 品牌类型工具
//
// 品牌类型（branded type）在类型层面给基础类型打标签，区分语义：
//   FilePath vs DirPath 都是 string，但编译器让你不能混用。
// 运行时完全是普通 string，零开销。

/** 品牌化字符串类型（匹配 zod 的 .brand() 输出形状） */
export type Branded<T, B extends string> = T & { readonly __brand: B };
