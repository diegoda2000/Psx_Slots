/**
 * Matemáticas de la slot DUELO (estilo "Wanted Dead or a Wild").
 * Sin dependencias de PixiJS: lo usan el juego y el simulador (sim/rtp.ts).
 */
import { MAX_WIN, tierFromScatters, type BonusTier } from '../../shared/lore';
import { randInt, weightedPick, type Rng } from '../../shared/rng';
import { COLS, PAY_SYMBOLS, PREMIUMS, ROWS, type Grid, type PaySymbol, type SymbolId } from '../../shared/symbols';
import type { BonusState } from '../../shared/game/types';

export const DUELO = {
  weights: { CUA: 24, CRZ: 24, CIR: 22, TRI: 22, MAC: 12, ELE: 10, IBE: 8, AND: 6, WILD: 3 } as Record<
    PaySymbol | 'WILD',
    number
  >,
  /** Columnas (0-index) donde puede salir WILD / VS: de la 2 a la 5. */
  wildReels: [1, 2, 3, 4],
  vsReels: [1, 2, 3, 4],
  vsChance: 0.022,
  scatterPerReel: 0.062,
  /** Pago por forma, en veces la apuesta, para 3/4/5/6 columnas. */
  pays: {
    CUA: [0.0018, 0.0035, 0.007, 0.0141],
    CRZ: [0.0018, 0.0035, 0.007, 0.0141],
    CIR: [0.0026, 0.0053, 0.0106, 0.0211],
    TRI: [0.0026, 0.0053, 0.0106, 0.0211],
    MAC: [0.0053, 0.0106, 0.0264, 0.0528],
    ELE: [0.007, 0.0141, 0.0352, 0.0704],
    IBE: [0.0106, 0.0211, 0.0528, 0.1056],
    AND: [0.0176, 0.0352, 0.088, 0.22],
  } as Record<PaySymbol, number[]>,
  /** [multiplicador, peso] del WILD que deja el ganador del VS. */
  multipliers: [
    [2, 30],
    [3, 22],
    [5, 18],
    [10, 14],
    [25, 9],
    [50, 5],
    [100, 2],
  ] as [number, number][],
  tiers: {
    1: { spins: 10, vsChance: 0.12, minMult: 2, sticky: false },
    2: { spins: 10, vsChance: 0.14, minMult: 5, sticky: false },
    3: { spins: 10, vsChance: 0.06, minMult: 2, sticky: true },
  } as Record<BonusTier, { spins: number; vsChance: number; minMult: number; sticky: boolean }>,
  retrigger: 5,
  buyPrice: { 1: 95, 2: 215, 3: 790 } as Record<BonusTier, number>,
};

export interface VsReel {
  col: number;
  fighters: [PaySymbol, PaySymbol];
  winner: 0 | 1;
  mult: number;
  sticky?: boolean;
}

export interface WayWin {
  sym: PaySymbol;
  length: number;
  ways: number;
  mult: number;
  amount: number;
  cells: [number, number][];
}

export interface DueloSpin {
  grid: Grid;
  vsReels: VsReel[];
  wins: WayWin[];
  total: number;
  scatters: number;
  tier: BonusTier | 0;
}

interface SpinOpts {
  vsChance: number;
  minMult: number;
  sticky: VsReel[];
}

const ALL = Object.entries(DUELO.weights) as [SymbolId, number][];
const NO_WILD = ALL.filter(([s]) => s !== 'WILD');

function pickMult(rng: Rng, min: number) {
  return weightedPick(rng, DUELO.multipliers.filter(([m]) => m >= min));
}

export function spinDuelo(rng: Rng, opts: SpinOpts): DueloSpin {
  const grid: Grid = [];
  for (let c = 0; c < COLS; c++) {
    const table = DUELO.wildReels.includes(c) ? ALL : NO_WILD;
    const col = [];
    for (let r = 0; r < ROWS; r++) col.push({ sym: weightedPick(rng, table) });
    grid.push(col);
  }
  // Como mucho un BONUS por columna.
  let scatters = 0;
  for (let c = 0; c < COLS; c++)
    if (rng() < DUELO.scatterPerReel) {
      grid[c][randInt(rng, ROWS)] = { sym: 'BONUS' };
      scatters++;
    }

  const vs: VsReel[] = opts.sticky.map((v) => ({ ...v, sticky: true }));
  for (const col of DUELO.vsReels) {
    if (vs.some((v) => v.col === col) || rng() >= opts.vsChance) continue;
    const a = PREMIUMS[randInt(rng, PREMIUMS.length)];
    let b = PREMIUMS[randInt(rng, PREMIUMS.length - 1)];
    if (b === a) b = PREMIUMS[PREMIUMS.length - 1];
    vs.push({ col, fighters: [a, b], winner: rng() < 0.5 ? 0 : 1, mult: pickMult(rng, opts.minMult) });
  }
  for (const v of vs) {
    if (grid[v.col].some((c) => c.sym === 'BONUS')) scatters--;
    grid[v.col] = Array.from({ length: ROWS }, () => ({ sym: 'VS' as const, mult: v.mult }));
  }
  vs.sort((a, b) => a.col - b.col);

  const wins = evaluateWays(grid, vs);
  return { grid, vsReels: vs, wins, total: wins.reduce((s, w) => s + w.amount, 0), scatters, tier: tierFromScatters(scatters) };
}

/** 15.625 formas: 3+ columnas seguidas desde la izquierda. WILD y VS sustituyen desde la columna 2. */
export function evaluateWays(grid: Grid, vs: VsReel[]): WayWin[] {
  const wins: WayWin[] = [];
  for (const sym of PAY_SYMBOLS) {
    let ways = 1;
    let length = 0;
    const cells: [number, number][] = [];
    for (let c = 0; c < COLS; c++) {
      let n = 0;
      grid[c].forEach((cell, r) => {
        if (cell.sym === sym || (c > 0 && (cell.sym === 'WILD' || cell.sym === 'VS'))) {
          n++;
          cells.push([c, r]);
        }
      });
      if (n === 0) break;
      ways *= n;
      length++;
    }
    if (length < 3) continue;
    // Varios VS en el mismo premio: sus multiplicadores se suman.
    const sum = vs.filter((v) => v.col < length).reduce((s, v) => s + v.mult, 0);
    const mult = sum > 0 ? sum : 1;
    wins.push({
      sym,
      length,
      ways,
      mult,
      amount: DUELO.pays[sym][length - 3] * ways * mult,
      cells: cells.filter(([c]) => c < length),
    });
  }
  return wins;
}

export function baseSpin(rng: Rng) {
  return spinDuelo(rng, { vsChance: DUELO.vsChance, minMult: 2, sticky: [] });
}

export interface DueloBonus extends BonusState {
  /** VS fijos del tocho. */
  sticky: VsReel[];
}

export function createBonus(tier: BonusTier): DueloBonus {
  return { tier, left: DUELO.tiers[tier].spins, played: 0, total: 0, sticky: [] };
}

export function bonusSpin(rng: Rng, b: DueloBonus): DueloSpin {
  const t = DUELO.tiers[b.tier];
  const res = spinDuelo(rng, { vsChance: t.vsChance, minMult: t.minMult, sticky: t.sticky ? b.sticky : [] });
  if (t.sticky) b.sticky = res.vsReels.map((v) => ({ ...v, sticky: true }));
  b.left--;
  b.played++;
  if (res.scatters >= 3) b.left += DUELO.retrigger;
  b.total += res.total;
  return res;
}

/** Bonus completo sin animaciones (para el simulador). Devuelve veces la apuesta. */
export function playBonus(rng: Rng, tier: BonusTier): number {
  const b = createBonus(tier);
  while (b.left > 0 && b.total < MAX_WIN) bonusSpin(rng, b);
  return Math.min(b.total, MAX_WIN);
}
