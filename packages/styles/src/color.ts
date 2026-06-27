// color.ts — Color 纯数据类型
//
// 不可变的颜色表示，支持十六进制和 lerp 插值。
// 无任何外部依赖，无副作用。

/** 不可变颜色值 */
export class Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;

  /** 从 24-bit 整数构造（如 0xffd300） */
  constructor(hex: number) {
    this.r = (hex >> 16) & 0xff;
    this.g = (hex >> 8) & 0xff;
    this.b = hex & 0xff;
  }

  /** 24-bit 整数表示 */
  get hex(): number {
    return ((this.r & 0xff) << 16) | ((this.g & 0xff) << 8) | (this.b & 0xff);
  }

  /** 6 位十六进制字符串（如 "ffd300"） */
  get hexString(): string {
    return this.hex.toString(16).padStart(6, "0");
  }

  clone(): Color {
    return new Color(this.hex);
  }

  /** 线性插值：this + (other - this) * alpha */
  lerp(other: Color, alpha: number): Color {
    const r = Math.floor(this.r + (other.r - this.r) * alpha);
    const g = Math.floor(this.g + (other.g - this.g) * alpha);
    const b = Math.floor(this.b + (other.b - this.b) * alpha);
    return new Color(((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff));
  }
}

/** 颜色对（渐变起点和终点） */
export interface ColorPair {
  startColor: Color;
  endColor: Color;
}
