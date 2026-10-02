/** Fuente de aleatoriedad: devuelve un número en [0, 1). */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** RNG con semilla (mulberry32), para simulaciones reproducibles. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedPick<T>(rng: Rng, table: ReadonlyArray<readonly [T, number]>): T {
  let total = 0;
  for (const [, w] of table) total += w;
  let r = rng() * total;
  for (const [v, w] of table) {
    r -= w;
    if (r < 0) return v;
  }
  return table[table.length - 1][0];
}

export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}
