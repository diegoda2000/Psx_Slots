import './style.css';
import { createStage, PAD, SlotShell } from '../../shared/game/shell';
import type { SlotGame } from '../../shared/game/types';
import { defaultRng } from '../../shared/rng';
import { DUELO_CHARS, SYMBOLS, wildOf, type CharWild } from '../../shared/symbols';
import { sfx } from '../../shared/sfx';
import { money, theme } from '../../shared/text';
import { speed, wait } from '../../shared/tween';
import { COLS } from '../../shared/symbols';
import { BOARD_H } from '../../shared/view/Board';
import { Overlay } from '../../shared/view/Overlay';
import { registerSymbolVisual } from '../../shared/view/SymbolVisual';
import { fsChipUrl, loadDueloArt, symbolTexture } from './art';
import { loadDueloSounds } from './sounds';
import { CharacterWildVisual } from './CharacterWildVisual';
import { ImageSymbolVisual } from './ImageSymbolVisual';
import { baseSpin, bonusSpin, createBonus, huntSpin, DUELO, DUELO_PAYS, DUELO_TIER_NAMES, type DueloBonus, type DueloTier } from './math';
import { FONT, RED, YELLOW } from './palette';
import { PITCH, rulesHtml } from './rules';
import { CELL_W, DueloBoard } from './view';

/** Tablero de reposo: una tirada base con los wilds cambiados por símbolos normales. */
const idleGrid = () =>
  baseSpin(defaultRng).grid.map((col) => col.map((c) => (c.sym.startsWith('W_') ? { sym: 'RATA' as const } : c)));

/** Hueco extra arriba para los nombres de los personajes sobre sus rodillos. */
const TOP = 26;
const W = COLS * CELL_W + PAD * 2;
const H = BOARD_H + PAD * 2 + TOP;

async function main() {
  Object.assign(theme, { font: FONT, gold: YELLOW, hot: RED, good: YELLOW });
  const { root } = await createStage(W, H, '40px "Luckiest Guy"');
  await loadDueloArt();
  loadDueloSounds();
  for (const p of DUELO_CHARS) registerSymbolVisual(wildOf(p), (sym, mult) => new CharacterWildVisual(sym as CharWild, mult));
  for (const s of [...DUELO_PAYS, 'BONUS' as const]) {
    const tex = symbolTexture(s);
    if (tex) registerSymbolVisual(s, () => new ImageSymbolVisual(tex, s === 'BONUS' ? 0.96 : 1));
  }
  document.querySelectorAll<HTMLImageElement>('img[data-fs]').forEach((img) => {
    if (fsChipUrl) img.src = fsChipUrl;
    else img.hidden = true;
  });
  const board = new DueloBoard();
  board.position.set(PAD, PAD + TOP);
  const overlay = new Overlay(W, H);
  root.addChild(board, overlay);

  const game: SlotGame<DueloBonus> = {
    buyPrice: DUELO.buyPrice,
    maxWin: DUELO.maxWin,
    hunt: { cost: DUELO.hunt.cost },
    bonusName: (t) => DUELO_TIER_NAMES[t as DueloTier],
    topTier: 2,
    turboModes: [
      { factor: 1, label: 'VELOCIDAD NORMAL' },
      { factor: 1.6, label: 'TURBO', cls: 'on' },
      { factor: 2.5, label: 'SUPER TURBO', cls: 'super' },
    ],
    bonusPitch: (t) => PITCH[t as DueloTier],
    rulesHtml,
    createBonus(tier) {
      const b = createBonus(tier as DueloTier);
      board.setDeath(DUELO.tiers[b.tier].deathReels ? b.death : null);
      return b;
    },
    bonusInfo: (b) => (b.death.length ? ` · ☠ ${b.death.map((p) => SYMBOLS[p].name).join(', ')}` : ''),
    sound(ev, v) {
      if (ev === 'bet') sfx.bet(v);
      else if (ev === 'bigWin') sfx.bigWin();
      else if (ev === 'bonusStart') sfx.bonusStart(v === 2);
      else sfx.bonusEnd(v);
    },
    endBonus: () => {
      board.clearReels();
      board.setDeath(null);
      // Tablero de reposo limpio, sin rodillos desplegados.
      void board.dropIn(idleGrid());
    },
    async spin(bonus, { bet, hunt }) {
      const res = bonus ? bonusSpin(defaultRng, bonus) : hunt ? huntSpin(defaultRng) : baseSpin(defaultRng);
      board.clearReels();
      // Sonidos: giro, golpe de cada rodillo al parar y campanita (cada vez más aguda) por ficha FS.
      let fsSeen = 0;
      // Super turbo: caen todos los rodillos a la vez (y suena un solo golpe).
      board.allAtOnce = speed.factor >= 2.5;
      board.onColumnLand = (c) => {
        if (!board.allAtOnce || c === 0) sfx.reelStop(c);
        if (res.grid[c].some((cell) => cell.sym === 'BONUS')) sfx.scatter(++fsSeen);
      };
      sfx.spin();
      await board.dropIn(res.grid);
      board.onColumnLand = undefined;
      // Primero se enseñan las fichas FS (bonus o tiradas extra); luego los despliegues pueden taparlas.
      const extra = bonus ? (DUELO.retrigger[Math.min(res.scatters, 3)] ?? 0) : 0;
      const fsCounts = bonus ? extra > 0 : res.scatters >= 3;
      if (fsCounts) {
        sfx.scatterWin();
        await Promise.all(board.symbolsOf('BONUS').map((s) => s.playWin()));
        if (extra > 0) sfx.extraSpins();
        if (extra > 0) await overlay.floatText(`+${extra} TIRADAS`, W / 2, H / 2, YELLOW, 48);
      }
      if (bonus && res.newDeath.length) {
        board.setDeath(bonus.death);
        for (const p of res.newDeath) {
          sfx.death();
          await overlay.floatText(`☠ ${SYMBOLS[p].name.toUpperCase()}`, W / 2, H / 2, SYMBOLS[p].color, 44);
        }
      }
      for (const w of res.wildReels) await board.expand(w);
      if (res.wins.length) {
        board.showLines(
          res.wins.map((w) => w.line),
          res.wins.map((w) => w.length),
        );
        const cells = res.wins.flatMap((w) => w.cells);
        // Wilds sin desplegar que entran en premio: ahora enseñan su multiplicador.
        const reveals = cells
          .map(([c, r]) => board.cells[c][r])
          .filter((s) => s?.sym.startsWith('W_'))
          .map((s) => s!.playReveal());
        if (reveals.length) sfx.mult();
        sfx.win(res.total);
        await Promise.all(reveals);
        await board.highlight(cells);
        const m = Math.max(...res.wins.map((w) => w.mult));
        const txt = m > 1 ? `${money(res.total * bet)}  (x${m})` : money(res.total * bet);
        overlay.floatText(txt, W / 2, H / 2, 0xffffff, 40);
        await wait(600);
        board.resetAlpha();
      }
      return { win: res.total, tier: bonus ? 0 : res.tier, retriggerShown: extra > 0 };
    },
  };

  new SlotShell(game, overlay);
  // Clic en los botones de la interfaz (girar y apuesta ya tienen su sonido).
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (b && !b.disabled && !['spin', 'betUp', 'betDown', 'buyBetUp', 'buyBetDown'].includes(b.id)) sfx.click();
  });
  await board.dropIn(idleGrid());
}

main();
