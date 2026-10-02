import { Ticker } from 'pixi.js';

export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeIn = (t: number) => t * t * t;
export const backOut = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

/** Velocidad global de animación (turbo = 2.5). */
export const speed = { factor: 1 };

type Props = Record<string, number>;

/** Tween mínimo sobre propiedades numéricas, con rutas tipo "scale.x". */
export function tween(target: object, to: Props, ms: number, ease = easeOut): Promise<void> {
  const dur = ms / speed.factor;
  const from: Props = {};
  for (const k of Object.keys(to)) from[k] = getPath(target, k);
  return new Promise((resolve) => {
    let t = 0;
    const tick = (ticker: Ticker) => {
      t += ticker.deltaMS;
      const p = Math.min(1, dur <= 0 ? 1 : t / dur);
      const e = ease(p);
      for (const k of Object.keys(to)) setPath(target, k, from[k] + (to[k] - from[k]) * e);
      if (p >= 1) {
        Ticker.shared.remove(tick);
        resolve();
      }
    };
    Ticker.shared.add(tick);
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms / speed.factor));
}

function getPath(o: object, path: string): number {
  return path.split('.').reduce<any>((acc, k) => acc[k], o);
}
function setPath(o: object, path: string, v: number) {
  const keys = path.split('.');
  const last = keys.pop()!;
  keys.reduce<any>((acc, k) => acc[k], o)[last] = v;
}
