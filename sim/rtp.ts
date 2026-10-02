/**
 * Simulador de RTP. Uso:
 *   npm run sim                       -> 1M tiradas base y 20k bonus por compra
 *   npm run sim -- --spins 5000000 --buys 50000 --seed 7 --game duelo
 */
import { MAX_WIN, type BonusTier } from '../src/shared/lore';
import { seededRng, type Rng } from '../src/shared/rng';
import * as duelo from '../src/games/duelo/math';
import * as olimpo from '../src/games/olimpo/math';

const arg = (name: string, def: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const SPINS = Number(arg('spins', '1000000'));
const BUYS = Number(arg('buys', '20000'));
const SEED = Number(arg('seed', '1'));
const ONLY = arg('game', 'all');

interface Game {
  name: string;
  base(rng: Rng): { win: number; tier: BonusTier | 0 };
  bonus(rng: Rng, tier: BonusTier): number;
  buyPrice: Record<BonusTier, number>;
}

const games: Game[] = [
  {
    name: 'duelo',
    base: (rng) => {
      const r = duelo.baseSpin(rng);
      return { win: r.total, tier: r.tier };
    },
    bonus: duelo.playBonus,
    buyPrice: duelo.DUELO.buyPrice,
  },
  {
    name: 'olimpo',
    base: (rng) => {
      const r = olimpo.baseSpin(rng);
      return { win: r.win, tier: r.res.tier };
    },
    bonus: olimpo.playBonus,
    buyPrice: olimpo.OLIMPO.buyPrice,
  },
];

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const TIERS: BonusTier[] = [1, 2, 3];

for (const g of games) {
  if (ONLY !== 'all' && ONLY !== g.name) continue;
  const rng = seededRng(SEED);
  const t0 = Date.now();

  let baseWin = 0;
  let bonusWin = 0;
  let hits = 0;
  let sumSq = 0;
  const triggers: Record<BonusTier, number> = { 1: 0, 2: 0, 3: 0 };
  for (let i = 0; i < SPINS; i++) {
    const r = g.base(rng);
    let w = Math.min(r.win, MAX_WIN);
    baseWin += w;
    if (r.tier) {
      triggers[r.tier]++;
      const b = g.bonus(rng, r.tier);
      bonusWin += b;
      w += b;
    }
    if (w > 0) hits++;
    sumSq += w * w;
  }
  const rtp = (baseWin + bonusWin) / SPINS;
  const sd = Math.sqrt(sumSq / SPINS - rtp * rtp);

  console.log(`\n=== ${g.name.toUpperCase()} (${SPINS.toLocaleString('es-ES')} tiradas, semilla ${SEED}) ===`);
  console.log(`RTP total        ${pct(rtp)}  (base ${pct(baseWin / SPINS)} + bonus ${pct(bonusWin / SPINS)})`);
  console.log(`Frecuencia premio ${pct(hits / SPINS)}   desviación típica ${sd.toFixed(2)}x`);
  for (const t of TIERS) {
    const n = triggers[t];
    console.log(`Bonus tier ${t}: 1 cada ${n ? Math.round(SPINS / n).toLocaleString('es-ES') : '∞'} tiradas`);
  }

  console.log('Compra de bonus:');
  for (const t of TIERS) {
    let sum = 0;
    let max = 0;
    for (let i = 0; i < BUYS; i++) {
      const b = g.bonus(rng, t);
      sum += b;
      if (b > max) max = b;
    }
    const avg = sum / BUYS;
    console.log(
      `  tier ${t}: precio ${g.buyPrice[t]}x  media ${avg.toFixed(1)}x  RTP ${pct(avg / g.buyPrice[t])}  máx ${max.toFixed(0)}x`,
    );
  }
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
