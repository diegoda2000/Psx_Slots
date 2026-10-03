/**
 * Simulador de matemáticas. Uso:
 *   npm run sim                       -> 1M tiradas base y 20k bonus por compra, las dos slots
 *   npm run sim -- --spins 10000000 --buys 100000 --seed 7 --game duelo
 *
 * Saca: RTP (con margen de error al 95%), reparto base/bonus, frecuencia de premio, volatilidad,
 * distribución de premios, frecuencia de cada bonus y, por compra, media, percentiles y RTP.
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
  tiers: BonusTier[];
  tierName: (t: BonusTier) => string;
  base(rng: Rng): { win: number; tier: BonusTier | 0 };
  bonus(rng: Rng, tier: BonusTier): number;
  buyPrice: Partial<Record<BonusTier, number>>;
  /** Premio máximo (veces la apuesta). */
  maxWin: number;
  /** Modo BonusHunt (si lo tiene): coste por tirada y tirada de ese modo. */
  hunt?: { cost: number; base(rng: Rng): { win: number; tier: BonusTier | 0 } };
}

const games: Game[] = [
  {
    name: 'duelo',
    tiers: duelo.DUELO_TIERS,
    tierName: (t) => duelo.DUELO_TIER_NAMES[t as duelo.DueloTier],
    base: (rng) => {
      const r = duelo.baseSpin(rng);
      return { win: r.total, tier: r.tier };
    },
    bonus: (rng, t) => duelo.playBonus(rng, t as duelo.DueloTier),
    buyPrice: duelo.DUELO.buyPrice,
    maxWin: duelo.DUELO.maxWin,
    hunt: {
      cost: duelo.DUELO.hunt.cost,
      base: (rng) => {
        const r = duelo.huntSpin(rng);
        return { win: r.total, tier: r.tier };
      },
    },
  },
  {
    name: 'olimpo',
    tiers: [1, 2, 3],
    tierName: (t) => ({ 1: 'BONUS', 2: 'SEMITOCHO', 3: 'TOCHO' })[t],
    base: (rng) => {
      const r = olimpo.baseSpin(rng);
      return { win: r.win, tier: r.res.tier };
    },
    bonus: olimpo.playBonus,
    buyPrice: olimpo.OLIMPO.buyPrice,
    maxWin: MAX_WIN,
  },
];

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const n0 = (v: number) => Math.round(v).toLocaleString('es-ES');
const BUCKETS: [string, number][] = [
  ['0x', 0],
  ['<1x', 1],
  ['1-5x', 5],
  ['5-20x', 20],
  ['20-100x', 100],
  ['100-1.000x', 1000],
  ['1.000x+', Infinity],
];
const bucketOf = (w: number) => (w === 0 ? 0 : BUCKETS.findIndex(([, hi], i) => i > 0 && w < hi));
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

for (const g of games) {
  if (ONLY !== 'all' && ONLY !== g.name) continue;
  const rng = seededRng(SEED);
  const t0 = Date.now();

  let baseWin = 0;
  let bonusWin = 0;
  let hits = 0;
  let sumSq = 0;
  let maxWin = 0;
  let maxHits = 0;
  const triggers: Partial<Record<BonusTier, number>> = {};
  const bonusSum: Partial<Record<BonusTier, number>> = {};
  const buckets = BUCKETS.map(() => 0);
  for (let i = 0; i < SPINS; i++) {
    const r = g.base(rng);
    let w = Math.min(r.win, g.maxWin);
    baseWin += w;
    if (r.tier) {
      triggers[r.tier] = (triggers[r.tier] ?? 0) + 1;
      const b = g.bonus(rng, r.tier);
      bonusSum[r.tier] = (bonusSum[r.tier] ?? 0) + b;
      bonusWin += b;
      w = Math.min(w + b, g.maxWin);
    }
    if (w > 0) hits++;
    if (w >= g.maxWin) maxHits++;
    if (w > maxWin) maxWin = w;
    buckets[bucketOf(w)]++;
    sumSq += w * w;
  }
  const rtp = (baseWin + bonusWin) / SPINS;
  const sd = Math.sqrt(sumSq / SPINS - rtp * rtp);
  const margin = (1.96 * sd) / Math.sqrt(SPINS);

  console.log(`\n=== ${g.name.toUpperCase()} (${n0(SPINS)} tiradas, semilla ${SEED}) ===`);
  console.log(`RTP total          ${pct(rtp)} ± ${pct(margin)}  (base ${pct(baseWin / SPINS)} + bonus ${pct(bonusWin / SPINS)})`);
  console.log(`Frecuencia premio  ${pct(hits / SPINS)} (1 de cada ${(SPINS / hits).toFixed(2)})`);
  console.log(`Volatilidad (DT)   ${sd.toFixed(1)}x por tirada · premio máx. visto ${n0(maxWin)}x · tope ${n0(g.maxWin)}x alcanzado ${maxHits} veces`);
  console.log('Distribución de premios por tirada (incluye el bonus que abre):');
  BUCKETS.forEach(([label], i) => console.log(`  ${label.padEnd(11)} ${pct(buckets[i] / SPINS).padStart(8)}`));
  for (const t of g.tiers) {
    const n = triggers[t] ?? 0;
    const avg = n ? (bonusSum[t] ?? 0) / n : 0;
    console.log(
      `${g.tierName(t).padEnd(10)} 1 de cada ${n ? n0(SPINS / n) : '∞'} tiradas · media ${avg.toFixed(1)}x · aporta ${pct((bonusSum[t] ?? 0) / SPINS)}`,
    );
  }

  console.log(`Compra de bonus (${n0(BUYS)} por tipo):`);
  for (const t of g.tiers) {
    const price = g.buyPrice[t];
    if (!price) continue;
    const res: number[] = [];
    for (let i = 0; i < BUYS; i++) res.push(g.bonus(rng, t));
    res.sort((a, b) => a - b);
    const avg = res.reduce((s, v) => s + v, 0) / BUYS;
    const sdb = Math.sqrt(res.reduce((s, v) => s + (v - avg) ** 2, 0) / BUYS);
    const below = res.filter((v) => v < price).length / BUYS;
    console.log(
      `  ${g.tierName(t).padEnd(10)} precio ${price}x · media ${avg.toFixed(1)}x · RTP ${pct(avg / price)} ± ${pct((1.96 * sdb) / Math.sqrt(BUYS) / price)}`,
    );
    console.log(
      `             mediana ${quantile(res, 0.5).toFixed(1)}x · p10 ${quantile(res, 0.1).toFixed(1)}x · p90 ${quantile(res, 0.9).toFixed(1)}x · p99 ${n0(quantile(res, 0.99))}x · máx ${n0(res[res.length - 1])}x · pierde dinero ${pct(below)}`,
    );
  }
  if (g.hunt) {
    const h = g.hunt;
    let paid = 0;
    let hHits = 0;
    let hSq = 0;
    const hTrig: Partial<Record<BonusTier, number>> = {};
    for (let i = 0; i < SPINS; i++) {
      const r = h.base(rng);
      let w = r.win;
      if (r.tier) {
        hTrig[r.tier] = (hTrig[r.tier] ?? 0) + 1;
        w += g.bonus(rng, r.tier);
      }
      w = Math.min(w, g.maxWin);
      paid += w;
      if (w > 0) hHits++;
      hSq += (w / h.cost) ** 2;
    }
    const hr = paid / SPINS / h.cost;
    const hsd = Math.sqrt(hSq / SPINS - hr * hr);
    console.log(`BonusHunt (${n0(SPINS)} tiradas a ${h.cost}x la apuesta):`);
    console.log(`  RTP ${pct(hr)} ± ${pct((1.96 * hsd) / Math.sqrt(SPINS))} · frecuencia premio ${pct(hHits / SPINS)}`);
    for (const t of g.tiers) {
      const n = hTrig[t] ?? 0;
      const nb = triggers[t] ?? 0;
      console.log(`  ${g.tierName(t).padEnd(10)} 1 de cada ${n ? n0(SPINS / n) : '∞'} tiradas (${nb ? (n / nb).toFixed(1) : '-'} veces más que normal)`);
    }
  }
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
