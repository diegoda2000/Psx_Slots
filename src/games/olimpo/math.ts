/**
 * Matemáticas de la slot OLIMPO (estilo "Gates of Olympus").
 * Sin dependencias de PixiJS: lo usan el juego y el simulador (sim/rtp.ts).
 */
import { MAX_WIN, tierFromScatters, type BonusTier } from '../../shared/lore';
import { weightedPick, type Rng } from '../../shared/rng';
import { COLS, ROWS, type Cell, type Grid, type Low, type Premium } from '../../shared/symbols';

/** En Olimpo pagan los botones y los personajes. */
export type OlimpoPay = Low | Premium;
/** Símbolos que pagan, de menos a más premio. */
export const OLIMPO_PAYS: OlimpoPay[] = ['CUA', 'CRZ', 'CIR', 'TRI', 'MAC', 'ELE', 'IBE', 'AND'];
import type { BonusState } from '../../shared/game/types';

export const OLIMPO = {
  weights: { CUA: 22, CRZ: 21, CIR: 20, TRI: 19, MAC: 17, ELE: 15, IBE: 13, AND: 11 } as Record<OlimpoPay, number>,
  scatterChance: 0.0105,
  orbChance: 0.004,
  /** Pago en veces la apuesta para 8-9 / 10-11 / 12+ símbolos. */
  pays: {
    CUA: [0.2, 0.6, 1.6],
    CRZ: [0.32, 0.72, 3.2],
    CIR: [0.4, 0.8, 4],
    TRI: [0.64, 0.96, 6.4],
    MAC: [1.2, 1.6, 9.6],
    ELE: [1.6, 4, 12],
    IBE: [2, 8, 20],
    AND: [8, 20, 40],
  } as Record<OlimpoPay, number[]>,
  minCount: 8,
  /** [multiplicador, peso] de los orbes. */
  orbs: [
    [2, 30], [3, 25], [4, 20], [5, 18], [6, 12], [8, 10], [10, 10], [12, 6],
    [15, 5], [20, 4], [25, 3], [50, 1.5], [100, 0.6], [250, 0.15], [500, 0.05],
  ] as [number, number][],
  tiers: {
    1: { spins: 15, orbChance: 0.02, minMult: 2 },
    2: { spins: 15, orbChance: 0.04, minMult: 2 },
    3: { spins: 15, orbChance: 0.05, minMult: 5 },
  } as Record<BonusTier, { spins: number; orbChance: number; minMult: number }>,
  retrigger: 5,
  buyPrice: { 1: 55, 2: 100, 3: 190 } as Record<BonusTier, number>,
};

interface CellOpts {
  orbChance: number;
  minMult: number;
}

export interface ClusterWin {
  sym: OlimpoPay;
  count: number;
  amount: number;
  cells: [number, number][];
}

export interface TumbleStep {
  grid: Grid;
  wins: ClusterWin[];
  stepWin: number;
}

export interface OlimpoSpin {
  steps: TumbleStep[];
  finalGrid: Grid;
  baseWin: number;
  multSum: number;
  scatters: number;
  tier: BonusTier | 0;
}

const SYMS = Object.entries(OLIMPO.weights) as [OlimpoPay, number][];

function randomCell(rng: Rng, o: CellOpts): Cell {
  const r = rng();
  if (r < OLIMPO.scatterChance) return { sym: 'BONUS' };
  if (r < OLIMPO.scatterChance + o.orbChance)
    return { sym: 'MULT', mult: weightedPick(rng, OLIMPO.orbs.filter(([m]) => m >= o.minMult)) };
  return { sym: weightedPick(rng, SYMS) };
}

/** Tirada con cascadas hasta que no quede premio. */
export function spinOlimpo(rng: Rng, o: CellOpts): OlimpoSpin {
  let grid: Grid = [];
  for (let c = 0; c < COLS; c++) {
    const col = [];
    for (let r = 0; r < ROWS; r++) col.push(randomCell(rng, o));
    grid.push(col);
  }
  const steps: TumbleStep[] = [];
  let baseWin = 0;
  for (;;) {
    const wins = evaluateClusters(grid);
    if (wins.length === 0) break;
    const stepWin = wins.reduce((s, w) => s + w.amount, 0);
    steps.push({ grid, wins, stepWin });
    baseWin += stepWin;
    grid = tumble(grid, wins, rng, o);
  }
  let multSum = 0;
  let scatters = 0;
  for (const col of grid)
    for (const c of col) {
      if (c.sym === 'MULT') multSum += c.mult!;
      if (c.sym === 'BONUS') scatters++;
    }
  return { steps, finalGrid: grid, baseWin, multSum, scatters, tier: tierFromScatters(scatters) };
}

/** Paga con 8 o más iguales en cualquier posición. */
export function evaluateClusters(grid: Grid): ClusterWin[] {
  const wins: ClusterWin[] = [];
  for (const sym of OLIMPO_PAYS) {
    const cells: [number, number][] = [];
    grid.forEach((col, c) => col.forEach((cell, r) => cell.sym === sym && cells.push([c, r])));
    if (cells.length < OLIMPO.minCount) continue;
    const band = cells.length >= 12 ? 2 : cells.length >= 10 ? 1 : 0;
    wins.push({ sym, count: cells.length, amount: OLIMPO.pays[sym][band], cells });
  }
  return wins;
}

function tumble(grid: Grid, wins: ClusterWin[], rng: Rng, o: CellOpts): Grid {
  const gone = new Set(wins.flatMap((w) => w.cells.map(([c, r]) => c * 100 + r)));
  return grid.map((col, c) => {
    const kept = col.filter((_, r) => !gone.has(c * 100 + r));
    const fresh: Cell[] = [];
    while (fresh.length + kept.length < ROWS) fresh.push(randomCell(rng, o));
    return [...fresh, ...kept];
  });
}

export function baseSpin(rng: Rng) {
  const res = spinOlimpo(rng, { orbChance: OLIMPO.orbChance, minMult: 2 });
  const appliedMult = res.baseWin > 0 && res.multSum > 0 ? res.multSum : 1;
  return { res, win: res.baseWin * appliedMult, appliedMult };
}

export interface OlimpoBonus extends BonusState {
  /** Multiplicador acumulado durante el bonus. */
  globalMult: number;
}

export function createBonus(tier: BonusTier): OlimpoBonus {
  return { tier, left: OLIMPO.tiers[tier].spins, played: 0, total: 0, globalMult: 0 };
}

export function bonusSpin(rng: Rng, b: OlimpoBonus) {
  const t = OLIMPO.tiers[b.tier];
  const res = spinOlimpo(rng, { orbChance: t.orbChance, minMult: t.minMult });
  let appliedMult = 1;
  if (res.baseWin > 0 && res.multSum > 0) {
    b.globalMult += res.multSum;
    appliedMult = b.globalMult;
  }
  const win = res.baseWin * appliedMult;
  b.left--;
  b.played++;
  if (res.scatters >= 3) b.left += OLIMPO.retrigger;
  b.total += win;
  return { res, win, appliedMult };
}

/** Bonus completo sin animaciones (para el simulador). Devuelve veces la apuesta. */
export function playBonus(rng: Rng, tier: BonusTier): number {
  const b = createBonus(tier);
  while (b.left > 0 && b.total < MAX_WIN) bonusSpin(rng, b);
  return Math.min(b.total, MAX_WIN);
}
