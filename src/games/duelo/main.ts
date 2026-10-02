import '../../shared/ui/style.css';
import { createStage, PAD, SlotShell } from '../../shared/game/shell';
import type { SlotGame } from '../../shared/game/types';
import { defaultRng } from '../../shared/rng';
import { SYMBOLS } from '../../shared/symbols';
import { money } from '../../shared/text';
import { wait } from '../../shared/tween';
import { BOARD_H, BOARD_W, cellX } from '../../shared/view/Board';
import { Overlay } from '../../shared/view/Overlay';
import { baseSpin, bonusSpin, createBonus, DUELO, type DueloBonus } from './math';
import { PITCH, rulesHtml } from './rules';
import { DueloBoard } from './view';

const W = BOARD_W + PAD * 2;
const H = BOARD_H + PAD * 2;

async function main() {
  const { root } = await createStage(W, H);
  const board = new DueloBoard();
  board.position.set(PAD, PAD);
  const overlay = new Overlay(W, H);
  root.addChild(board, overlay);

  const game: SlotGame<DueloBonus> = {
    buyPrice: DUELO.buyPrice,
    bonusPitch: (t) => PITCH[t],
    rulesHtml,
    createBonus(tier) {
      const b = createBonus(tier);
      board.setDeath(DUELO.tiers[tier].deathReels ? b.death : null);
      return b;
    },
    bonusInfo: (b) => (b.death.length ? ` · ☠ ${b.death.map((p) => SYMBOLS[p].name).join(', ')}` : ''),
    endBonus: () => {
      board.clearReels();
      board.setDeath(null);
    },
    async spin(bonus, { bet }) {
      const keep = bonus ? [...bonus.sticky] : [];
      const res = bonus ? bonusSpin(defaultRng, bonus) : baseSpin(defaultRng);
      board.clearReels(keep);
      await board.dropIn(res.grid, keep.map((w) => w.col));
      if (bonus && res.newDeath.length) {
        board.setDeath(bonus.death);
        for (const p of res.newDeath)
          await overlay.floatText(`☠ ${SYMBOLS[p].name.toUpperCase()}`, W / 2, H / 2, SYMBOLS[p].color, 44);
      }
      for (const w of res.wildReels) {
        if (keep.some((k) => k.col === w.col)) continue;
        await board.expand(w);
        overlay.floatText(`x${w.mult}`, PAD + cellX(w.col), H / 2, 0xffffff, 40);
      }
      if (res.wins.length) {
        board.showLines(
          res.wins.map((w) => w.line),
          res.wins.map((w) => w.length),
        );
        await board.highlight(res.wins.flatMap((w) => w.cells));
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
  await board.dropIn(baseSpin(defaultRng).grid);
}

main();
