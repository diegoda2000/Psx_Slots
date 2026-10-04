/**
 * Matemáticas de la slot DUELO (estilo "Life and Death" de Hacksaw).
 * Sin dependencias de PixiJS: lo usan el juego y el simulador (sim/rtp.ts).
 *
 * Los 4 personajes hacen de "jinetes": NO son símbolos de pago, solo wilds multiplicadores.
 * Como mucho hay uno de cada en pantalla. Pueden caer en cualquier rodillo central (2-5);
 * si caen en el suyo se expanden a toda la columna (solo si así entran en algún premio).
 * En otro rodillo hacen de wild normal con su multiplicador. Varios multiplicadores se suman.
 */
import { randInt, weightedPick, type Rng } from '../../shared/rng';
import {
  COLS,
  DUELO_CHARS,
  ROWS,
  wildOf,
  type Cell,
  type CharWild,
  type Grid,
  type DueloSym,
  type DueloChar,
} from '../../shared/symbols';

import type { BonusState } from '../../shared/game/types';

/** En Duelo pagan las ilustraciones del canal: 4 bajos (rata a radio) y 4 altos (ternasco a Andy the Hutt). */
export type DueloPay = DueloSym;
/** Símbolos que pagan, de menos a más premio (8 = rata ... 1 = Andy the Hutt). */
export const DUELO_PAYS: DueloPay[] = ['RATA', 'REMOS', 'OMG', 'RADIO', 'TERNASCO', 'SIM3', 'DORMIDO', 'HUTT'];

/** Rodillo de cada personaje (0-index): Macaco 2, Majarias 3, Iberru 4, Andy 5. */
export const CHAR_REEL: Record<DueloChar, number> = { MAC: 1, MAJ: 2, IBE: 3, AND: 4 };
export const REEL_CHAR: (DueloChar | null)[] = [null, 'MAC', 'MAJ', 'IBE', 'AND', null];

/** Las 19 líneas de Life and Death (fila de cada rodillo, 0 = arriba), en el mismo orden que su tabla. */
export const LINES: number[][] = [
  [0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3, 3],
  [4, 4, 4, 4, 4, 4],
  [0, 1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1, 2],
  [2, 3, 2, 3, 2, 3],
  [3, 4, 3, 4, 3, 4],
  [1, 0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2, 1],
  [3, 2, 3, 2, 3, 2],
  [4, 3, 4, 3, 4, 3],
  [0, 1, 2, 2, 1, 0],
  [1, 2, 3, 3, 2, 1],
  [2, 3, 4, 4, 3, 2],
  [4, 3, 2, 2, 3, 4],
  [3, 2, 1, 1, 2, 3],
  [2, 1, 0, 0, 1, 2],
];

/** Bonus de Duelo: 1 = BONUS (3 fichas), 2 = TOCHO (4 o más fichas, rodillos de la muerte). */
export type DueloTier = 1 | 2;
export const DUELO_TIERS: DueloTier[] = [1, 2];
export const DUELO_TIER_NAMES: Record<DueloTier, string> = { 1: 'BONUS', 2: 'TOCHO' };

export const DUELO = {
  /** Premio máximo en veces la apuesta (el de Life and Death). */
  maxWin: 15_000,
  weights: { RATA: 34, REMOS: 32, OMG: 32, RADIO: 30, TERNASCO: 22, SIM3: 20, DORMIDO: 17, HUTT: 14 } as Record<DueloPay, number>,
  /**
   * Wilds por rodillo central en media (juego base): 4 × wildChance personajes por tirada, repartidos según charWeights.
   */
  wildChance: 0.02185,
  /**
   * Frecuencia relativa de cada personaje: cuanto mejor, más raro. Cada uno sale la mitad de veces que el anterior
   * (Macaco 8 veces más que Andy).
   */
  charWeights: { MAC: 8, MAJ: 4, IBE: 2, AND: 1 } as Record<DueloChar, number>,
  /** Probabilidad de que un personaje caiga en su propio rodillo (si está libre); si no, en otro rodillo central. */
  ownChance: 0.6,
  /** [multiplicador, peso] de cada personaje (valores de Life and Death). */
  wildMults: {
    MAC: [[2, 50], [3, 30], [4, 20]],
    MAJ: [[5, 30], [6, 25], [7, 20], [8, 15], [9, 10]],
    IBE: [[10, 40], [15, 30], [20, 18], [25, 12]],
    AND: [[30, 40], [40, 25], [50, 18], [75, 10], [100, 5], [200, 2]],
  } as Record<DueloChar, [number, number][]>,
  scatterPerReel: 0.103,
  /**
   * Pago por línea con apuesta de 1 € (= veces la apuesta total), copiado de Life and Death para 3/4/5/6 seguidos:
   * rata = 10, remos = J, OMG = K, radio = A, ternasco = corazón, 3 = sol, 2 = mano, Andy the Hutt = caras.
   */
  pays: {
    RATA: [0.1, 0.3, 1, 3],
    REMOS: [0.2, 0.5, 1.5, 5],
    OMG: [0.2, 0.5, 1.5, 5],
    RADIO: [0.3, 1, 3, 10],
    TERNASCO: [0.5, 1.5, 5, 15],
    SIM3: [1, 2.5, 7.5, 25],
    DORMIDO: [1, 2.5, 7.5, 25],
    HUTT: [2, 5, 15, 50],
  } as Record<DueloPay, number[]>,
  /** Escala global de la tabla de pagos (1 = tabla de Life and Death tal cual). */
  payScale: 1,
  tiers: {
    // BONUS (como Devastation): más wilds.
    1: { spins: 10, wildChance: 0.1622, deathReels: false },
    // TOCHO (antes semitocho; como Reckoning): rodillos de la muerte.
    2: { spins: 10, wildChance: 0.1978, deathReels: true },
  } as Record<DueloTier, { spins: number; wildChance: number; deathReels: boolean }>,
  /** Tiradas extra dentro del bonus por número de fichas FS. */
  retrigger: { 2: 2, 3: 4 } as Record<number, number>,
  buyPrice: { 1: 100, 2: 200 } as Record<DueloTier, number>,
  /**
   * BonusHunt FeatureSpins (como Hacksaw): cada tirada cuesta 3 veces la apuesta y salen más fichas FS
   * (el bonus entra unas 5-6 veces más). Mismo RTP que el juego normal.
   */
  hunt: { cost: 3, scatterPerReel: 0.1889 },
};

/** 3 fichas FS = BONUS, 4 o más = TOCHO. */
export const dueloTierFromScatters = (n: number): DueloTier | 0 => (n >= 4 ? 2 : n === 3 ? 1 : 0);

export interface WildReel {
  col: number;
  char: DueloChar;
  mult: number;
  /** Fila donde cayó el wild antes de expandirse. */
  row: number;
}

export interface LineWin {
  line: number;
  sym: DueloPay;
  length: number;
  mult: number;
  amount: number;
  cells: [number, number][];
}

export interface DueloSpin {
  /** Tablero tal como cae, antes de expandir. */
  grid: Grid;
  /** Rodillos wild expandidos. */
  wildReels: WildReel[];
  wins: LineWin[];
  total: number;
  scatters: number;
  tier: DueloTier | 0;
  /** Personajes que activan su rodillo de la muerte en esta tirada. */
  newDeath: DueloChar[];
}

interface SpinOpts {
  wildChance: number;
  /** Probabilidad de ficha FS en cada rodillo central (por defecto la del juego base). */
  scatterChance?: number;
  /** Personajes con rodillo de la muerte activo (se expanden en cualquier rodillo central). */
  death: DueloChar[] | null;
}

const isWild = (c: Cell): c is Cell & { sym: CharWild } => c.sym.startsWith('W_');

export function spinDuelo(rng: Rng, opts: SpinOpts): DueloSpin {
  const SYMS = Object.entries(DUELO.weights) as [DueloPay, number][];
  const grid: Grid = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) col.push({ sym: weightedPick(rng, SYMS) });
    grid.push(col);
  }

  // Como mucho una ficha FS por rodillo, y solo en los rodillos centrales (2 a 5), como los personajes.
  let scatters = 0;
  for (let c = 1; c <= 4; c++)
    if (rng() < (opts.scatterChance ?? DUELO.scatterPerReel)) {
      grid[c][randInt(rng, ROWS)] = { sym: 'BONUS' };
      scatters++;
    }

  // Cada personaje sale (o no) por separado, los flojos más que los buenos; como mucho uno de cada y un wild por rodillo.
  // Se colocan del más raro al más común para que el bueno no se quede sin su rodillo.
  const candidates: WildReel[] = [];
  const newDeath: DueloChar[] = [];
  const death = new Set(opts.death ?? []);
  const totalW = DUELO_CHARS.reduce((t, p) => t + DUELO.charWeights[p], 0);
  const taken = new Set<number>();
  const order = [...DUELO_CHARS].sort((a, b) => DUELO.charWeights[a] - DUELO.charWeights[b]);
  for (const char of order) {
    const p = Math.min(1, (4 * opts.wildChance * DUELO.charWeights[char]) / totalW);
    if (rng() >= p) continue;
    const ownCol = CHAR_REEL[char];
    const free = [1, 2, 3, 4].filter((c) => !taken.has(c));
    if (!free.length) continue;
    const others = free.filter((c) => c !== ownCol);
    const c =
      free.includes(ownCol) && (others.length === 0 || rng() < DUELO.ownChance) ? ownCol : others[randInt(rng, others.length)];
    taken.add(c);
    const own = REEL_CHAR[c]!;
    const mult = weightedPick(rng, DUELO.wildMults[char]);
    const rows = grid[c].map((cell, r) => (cell.sym === 'BONUS' ? -1 : r)).filter((r) => r >= 0);
    const row = rows[randInt(rng, rows.length)];
    grid[c][row] = { sym: wildOf(char), mult };
    if (opts.death && char === own && !death.has(char)) {
      death.add(char);
      newDeath.push(char);
    }
    // Se expande en su rodillo, o en cualquiera si su rodillo de la muerte está activo.
    // Una ficha FS en el mismo rodillo no lo impide: sigue contando y se ve encima del rodillo desplegado.
    if (char === own || death.has(char)) candidates.push({ col: c, char, mult, row });
  }
  candidates.sort((a, b) => a.col - b.col);

  // Solo se expanden los que entran en algún premio una vez expandidos (regla de Life and Death).
  let expanded = candidates;
  let wins: LineWin[] = [];
  for (;;) {
    wins = evaluateLines(grid, expanded);
    const used = expanded.filter((w) => wins.some((win) => win.cells.some(([c]) => c === w.col)));
    if (used.length === expanded.length) break;
    expanded = used;
  }

  const wildReels = [...expanded].sort((a, b) => a.col - b.col);
  const total = wins.reduce((s, w) => s + w.amount, 0);
  return { grid, wildReels, wins, total, scatters, tier: dueloTierFromScatters(scatters), newDeath };
}

/** 19 líneas, de izquierda a derecha, 3 o más seguidos. Los multiplicadores de los wilds de la línea se suman. */
export function evaluateLines(grid: Grid, wildReels: WildReel[]): LineWin[] {
  const reelMult = new Map(wildReels.map((w) => [w.col, w.mult]));
  const at = (c: number, r: number): Cell =>
    reelMult.has(c) ? { sym: 'W_AND', mult: reelMult.get(c) } : grid[c][r];
  const wins: LineWin[] = [];
  LINES.forEach((line, li) => {
    const first = at(0, line[0]);
    if (!DUELO_PAYS.includes(first.sym as DueloPay)) return;
    const sym = first.sym as DueloPay;
    let length = 0;
    let mult = 0;
    for (let c = 0; c < COLS; c++) {
      const cell = at(c, line[c]);
      if (cell.sym === sym) length++;
      else if (isWild(cell)) {
        length++;
        mult += cell.mult ?? 0;
      } else break;
    }
    if (length < 3) return;
    const m = Math.max(1, mult);
    wins.push({
      line: li,
      sym,
      length,
      mult: m,
      amount: DUELO.pays[sym][length - 3] * DUELO.payScale * m,
      cells: line.slice(0, length).map((r, c) => [c, r] as [number, number]),
    });
  });
  return wins;
}

export function baseSpin(rng: Rng) {
  return spinDuelo(rng, { wildChance: DUELO.wildChance, death: null });
}

/** Tirada del modo BonusHunt: cuesta DUELO.hunt.cost veces la apuesta y salen más fichas FS. */
export function huntSpin(rng: Rng) {
  return spinDuelo(rng, { wildChance: DUELO.wildChance, death: null, scatterChance: DUELO.hunt.scatterPerReel });
}

export interface DueloBonus extends BonusState {
  tier: DueloTier;
  /** Personajes con rodillo de la muerte activo (tocho). */
  death: DueloChar[];
}

export function createBonus(tier: DueloTier): DueloBonus {
  return { tier, left: DUELO.tiers[tier].spins, played: 0, total: 0, death: [] };
}

export function bonusSpin(rng: Rng, b: DueloBonus): DueloSpin {
  const t = DUELO.tiers[b.tier];
  const res = spinDuelo(rng, { wildChance: t.wildChance, death: t.deathReels ? b.death : null });
  b.death.push(...res.newDeath);
  b.left--;
  b.played++;
  b.left += DUELO.retrigger[Math.min(res.scatters, 3)] ?? 0;
  b.total += res.total;
  return res;
}

/** Bonus completo sin animaciones (para el simulador). Devuelve veces la apuesta. */
export function playBonus(rng: Rng, tier: DueloTier): number {
  const b = createBonus(tier);
  while (b.left > 0 && b.total < DUELO.maxWin) bonusSpin(rng, b);
  return Math.min(b.total, DUELO.maxWin);
}
