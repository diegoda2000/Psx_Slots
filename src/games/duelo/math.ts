/**
 * Matemáticas de la slot DUELO (estilo "Life and Death" de Hacksaw).
 * Sin dependencias de PixiJS: lo usan el juego y el simulador (sim/rtp.ts).
 *
 * Los 4 personajes premium hacen de "jinetes": cada uno tiene un rodillo central y su
 * wild multiplicador. Si su wild cae en su rodillo, se expande a toda la columna
 * (solo si así entra en algún premio). Varios multiplicadores en un premio se suman.
 */
import { MAX_WIN, tierFromScatters, type BonusTier } from '../../shared/lore';
import { randInt, weightedPick, type Rng } from '../../shared/rng';
import {
  COLS,
  PAY_SYMBOLS,
  PREMIUMS,
  ROWS,
  wildOf,
  type Cell,
  type CharWild,
  type Grid,
  type PaySymbol,
  type Premium,
} from '../../shared/symbols';
import type { BonusState } from '../../shared/game/types';

/** Rodillo de cada personaje (0-index): Macaco 2, Elena 3, Iberru 4, Andy 5. */
export const CHAR_REEL: Record<Premium, number> = { MAC: 1, ELE: 2, IBE: 3, AND: 4 };
export const REEL_CHAR: (Premium | null)[] = [null, 'MAC', 'ELE', 'IBE', 'AND', null];

/** 19 líneas: fila de cada rodillo. */
export const LINES: number[][] = [
  [0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3, 3],
  [4, 4, 4, 4, 4, 4],
  [0, 1, 2, 2, 1, 0],
  [4, 3, 2, 2, 3, 4],
  [1, 2, 3, 3, 2, 1],
  [3, 2, 1, 1, 2, 3],
  [2, 1, 0, 0, 1, 2],
  [2, 3, 4, 4, 3, 2],
  [0, 0, 1, 1, 0, 0],
  [4, 4, 3, 3, 4, 4],
  [1, 0, 0, 0, 0, 1],
  [3, 4, 4, 4, 4, 3],
  [1, 2, 1, 1, 2, 1],
  [3, 2, 3, 3, 2, 3],
  [2, 1, 2, 2, 1, 2],
  [2, 3, 2, 2, 3, 2],
];

export const DUELO = {
  weights: { CUA: 24, CRZ: 24, CIR: 22, TRI: 22, MAC: 12, ELE: 10, IBE: 8, AND: 6 } as Record<PaySymbol, number>,
  /** Probabilidad de wild en cada rodillo central (juego base). */
  wildChance: 0.042,
  /** Probabilidad de que el wild que cae sea el del dueño del rodillo. */
  ownChance: 0.6,
  /** [multiplicador, peso] de cada personaje. Andy, "el sacarino", el más bestia. */
  wildMults: {
    MAC: [[2, 50], [3, 30], [4, 20]],
    ELE: [[5, 30], [6, 25], [7, 20], [8, 15], [9, 10]],
    IBE: [[10, 40], [15, 30], [20, 18], [25, 12]],
    AND: [[30, 40], [40, 25], [50, 18], [75, 10], [100, 5], [200, 2]],
  } as Record<Premium, [number, number][]>,
  scatterPerReel: 0.062,
  /** Pago por línea, en veces la apuesta total, para 3/4/5/6 seguidos. */
  pays: {
    CUA: [0.1, 0.25, 0.5, 1],
    CRZ: [0.1, 0.25, 0.5, 1],
    CIR: [0.15, 0.3, 0.75, 1.5],
    TRI: [0.15, 0.3, 0.75, 1.5],
    MAC: [0.25, 0.5, 1.25, 2.5],
    ELE: [0.3, 0.75, 1.5, 3],
    IBE: [0.5, 1, 2.5, 5],
    AND: [1, 2, 5, 10],
  } as Record<PaySymbol, number[]>,
  /** Escala global de la tabla de pagos (para afinar el RTP). */
  payScale: 1,
  tiers: {
    // BONUS (como Devastation): más wilds.
    1: { spins: 10, wildChance: 0.245, deathReels: false, sticky: false },
    // SEMITOCHO (como Reckoning): rodillos de la muerte.
    2: { spins: 10, wildChance: 0.252, deathReels: true, sticky: false },
    // TOCHO: rodillos de la muerte y los wilds expandidos se quedan fijos.
    3: { spins: 10, wildChance: 0.1, deathReels: true, sticky: true },
  } as Record<BonusTier, { spins: number; wildChance: number; deathReels: boolean; sticky: boolean }>,
  /** Tiradas extra dentro del bonus por número de BONUS. */
  retrigger: { 2: 2, 3: 4 } as Record<number, number>,
  buyPrice: { 1: 100, 2: 200, 3: 500 } as Record<BonusTier, number>,
};

export interface WildReel {
  col: number;
  char: Premium;
  mult: number;
  /** Fila donde cayó el wild antes de expandirse. */
  row: number;
  sticky?: boolean;
}

export interface LineWin {
  line: number;
  sym: PaySymbol;
  length: number;
  mult: number;
  amount: number;
  cells: [number, number][];
}

export interface DueloSpin {
  /** Tablero tal como cae, antes de expandir. */
  grid: Grid;
  /** Rodillos wild expandidos (incluye los fijos). */
  wildReels: WildReel[];
  wins: LineWin[];
  total: number;
  scatters: number;
  tier: BonusTier | 0;
  /** Personajes que activan su rodillo de la muerte en esta tirada. */
  newDeath: Premium[];
}

interface SpinOpts {
  wildChance: number;
  /** Personajes con rodillo de la muerte activo (se expanden en cualquier rodillo central). */
  death: Premium[] | null;
  sticky: WildReel[];
}

const SYMS = Object.entries(DUELO.weights) as [PaySymbol, number][];
const isWild = (c: Cell): c is Cell & { sym: CharWild } => c.sym.startsWith('W_');

export function spinDuelo(rng: Rng, opts: SpinOpts): DueloSpin {
  const stickyCols = new Set(opts.sticky.map((s) => s.col));
  const grid: Grid = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) col.push({ sym: weightedPick(rng, SYMS) });
    grid.push(col);
  }

  // Como mucho un BONUS por rodillo (no en los rodillos fijos).
  let scatters = 0;
  for (let c = 0; c < COLS; c++)
    if (!stickyCols.has(c) && rng() < DUELO.scatterPerReel) {
      grid[c][randInt(rng, ROWS)] = { sym: 'BONUS' };
      scatters++;
    }

  // Como mucho un wild de personaje por rodillo central.
  const candidates: WildReel[] = [];
  const newDeath: Premium[] = [];
  const death = new Set(opts.death ?? []);
  for (let c = 1; c <= 4; c++) {
    if (stickyCols.has(c) || rng() >= opts.wildChance) continue;
    const own = REEL_CHAR[c]!;
    const others = PREMIUMS.filter((p) => p !== own);
    const char = rng() < DUELO.ownChance ? own : others[randInt(rng, others.length)];
    const mult = weightedPick(rng, DUELO.wildMults[char]);
    const free = grid[c].map((cell, r) => (cell.sym === 'BONUS' ? -1 : r)).filter((r) => r >= 0);
    const row = free[randInt(rng, free.length)];
    grid[c][row] = { sym: wildOf(char), mult };
    if (opts.death && char === own && !death.has(char)) {
      death.add(char);
      newDeath.push(char);
    }
    // Se expande en su rodillo, o en cualquiera si su rodillo de la muerte está activo.
    // Un rodillo con BONUS no se expande, para no tapar el scatter.
    const hasScatter = grid[c].some((cell) => cell.sym === 'BONUS');
    if (!hasScatter && (char === own || death.has(char))) candidates.push({ col: c, char, mult, row });
  }

  // Solo se expanden los que entran en algún premio una vez expandidos.
  let expanded = candidates;
  let wins: LineWin[] = [];
  for (;;) {
    wins = evaluateLines(grid, [...opts.sticky, ...expanded]);
    const used = expanded.filter((w) => wins.some((win) => win.length > w.col && win.cells.some(([c]) => c === w.col)));
    if (used.length === expanded.length) break;
    expanded = used;
  }

  const wildReels = [...opts.sticky.map((s) => ({ ...s, sticky: true })), ...expanded].sort((a, b) => a.col - b.col);
  const total = wins.reduce((s, w) => s + w.amount, 0);
  return { grid, wildReels, wins, total, scatters, tier: tierFromScatters(scatters), newDeath };
}

/** 19 líneas, de izquierda a derecha, 3 o más seguidos. Los multiplicadores de los wilds de la línea se suman. */
export function evaluateLines(grid: Grid, wildReels: WildReel[]): LineWin[] {
  const reelMult = new Map(wildReels.map((w) => [w.col, w.mult]));
  const at = (c: number, r: number): Cell =>
    reelMult.has(c) ? { sym: 'W_AND', mult: reelMult.get(c) } : grid[c][r];
  const wins: LineWin[] = [];
  LINES.forEach((line, li) => {
    const first = at(0, line[0]);
    if (!PAY_SYMBOLS.includes(first.sym as PaySymbol)) return;
    const sym = first.sym as PaySymbol;
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
  return spinDuelo(rng, { wildChance: DUELO.wildChance, death: null, sticky: [] });
}

export interface DueloBonus extends BonusState {
  /** Personajes con rodillo de la muerte activo (semitocho y tocho). */
  death: Premium[];
  /** Rodillos wild fijos (tocho). */
  sticky: WildReel[];
}

export function createBonus(tier: BonusTier): DueloBonus {
  return { tier, left: DUELO.tiers[tier].spins, played: 0, total: 0, death: [], sticky: [] };
}

export function bonusSpin(rng: Rng, b: DueloBonus): DueloSpin {
  const t = DUELO.tiers[b.tier];
  const res = spinDuelo(rng, {
    wildChance: t.wildChance,
    death: t.deathReels ? b.death : null,
    sticky: t.sticky ? b.sticky : [],
  });
  b.death.push(...res.newDeath);
  if (t.sticky) b.sticky = res.wildReels.map((w) => ({ ...w, sticky: true }));
  b.left--;
  b.played++;
  b.left += DUELO.retrigger[Math.min(res.scatters, 3)] ?? 0;
  b.total += res.total;
  return res;
}

/** Bonus completo sin animaciones (para el simulador). Devuelve veces la apuesta. */
export function playBonus(rng: Rng, tier: BonusTier): number {
  const b = createBonus(tier);
  while (b.left > 0 && b.total < MAX_WIN) bonusSpin(rng, b);
  return Math.min(b.total, MAX_WIN);
}
