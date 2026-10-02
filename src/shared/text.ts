import { Text, type TextStyleOptions } from 'pixi.js';

export const DISPLAY_FONT = 'Bungee, Impact, "Arial Black", sans-serif';

export function label(text: string, size: number, fill = 0xffffff, extra: TextStyleOptions = {}): Text {
  const t = new Text({
    text,
    style: {
      fontFamily: DISPLAY_FONT,
      fontSize: size,
      fill,
      stroke: { color: 0x000000, width: Math.max(2, size / 7), join: 'round' },
      align: 'center',
      ...extra,
    },
  });
  t.anchor.set(0.5);
  return t;
}

export function multColor(m: number): number {
  return m >= 100 ? 0xff3df2 : m >= 25 ? 0xff4d4d : m >= 10 ? 0xffa62e : m >= 5 ? 0x4dff88 : 0x4dc7ff;
}

export function shade(color: number, k: number): number {
  const r = Math.round(((color >> 16) & 255) * k);
  const g = Math.round(((color >> 8) & 255) * k);
  const b = Math.round((color & 255) * k);
  return (r << 16) | (g << 8) | b;
}

export const money = (v: number) => `${v.toFixed(2)} €`;
