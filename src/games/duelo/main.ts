import './style.css';
import { createStage, PAD, SlotShell } from '../../shared/game/shell';
import type { SlotGame } from '../../shared/game/types';
import { defaultRng } from '../../shared/rng';
import { DUELO_CHARS, SYMBOLS, wildOf, type CharWild } from '../../shared/symbols';
import { money, theme } from '../../shared/text';
import { wait } from '../../shared/tween';
import { COLS } from '../../shared/symbols';
import { BOARD_H } from '../../shared/view/Board';
import { Overlay } from '../../shared/view/Overlay';
import { registerSymbolVisual } from '../../shared/view/SymbolVisual';
import { fsChipUrl, loadDueloArt, symbolTexture } from './art';
import { CharacterWildVisual } from './CharacterWildVisual';
import { ImageSymbolVisual } from './ImageSymbolVisual';
import { baseSpin, bonusSpin, createBonus, DUELO, DUELO_PAYS, DUELO_TIER_NAMES, type DueloBonus, type DueloTier } from './math';
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
    bonusName: (t) => DUELO_TIER_NAMES[t as DueloTier],
    topTier: 2,
    bonusPitch: (t) => PITCH[t as DueloTier],
    rulesHtml,
    createBonus(tier) {
      const b = createBonus(tier as DueloTier);
      board.setDeath(DUELO.tiers[b.tier].deathReels ? b.death : null);
      return b;
    },
    bonusInfo: (b) => (b.death.length ? ` · ☠ ${b.death.map((p) => SYMBOLS[p].name).join(', ')}` : ''),
    endBonus: () => {
      board.clearReels();
      board.setDeath(null);
      // Tablero de reposo limpio, sin rodillos desplegados.
      void board.dropIn(idleGrid());
    },
    async spin(bonus, { bet }) {
      const res = bonus ? bonusSpin(defaultRng, bonus) : baseSpin(defaultRng);
      board.clearReels();
      await board.dropIn(res.grid);
      if (bonus && res.newDeath.length) {
        board.setDeath(bonus.death);
        for (const p of res.newDeath)
          await overlay.floatText(`☠ ${SYMBOLS[p].name.toUpperCase()}`, W / 2, H / 2, SYMBOLS[p].color, 44);
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
        await Promise.all(reveals);
        await board.highlight(cells);
        const m = Math.max(...res.wins.map((w) => w.mult));
        const txt = m > 1 ? `${money(res.total * bet)}  (x${m})` : money(res.total * bet);
        overlay.floatText(txt, W / 2, H / 2, 0xffffff, 40);
        await wait(600);
        board.resetAlpha();
      }
      if (res.scatters >= 3 || (bonus && res.scatters >= 2))
        await Promise.all(board.symbolsOf('BONUS').map((s) => s.playWin()));
      return { win: res.total, tier: bonus ? 0 : res.tier };
    },
  };

  new SlotShell(game, overlay);
  await board.dropIn(idleGrid());
}

main();
