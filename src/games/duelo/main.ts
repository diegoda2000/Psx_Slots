import '../../shared/ui/style.css';
import { createStage, PAD, SlotShell } from '../../shared/game/shell';
import type { SlotGame } from '../../shared/game/types';
import { defaultRng } from '../../shared/rng';
import { money } from '../../shared/text';
import { wait } from '../../shared/tween';
import { BOARD_H, BOARD_W } from '../../shared/view/Board';
import { baseSpin, bonusSpin, createBonus, DUELO, type DueloBonus } from './math';
import { PITCH, rulesHtml } from './rules';
import { DueloBoard, DueloOverlay } from './view';

const W = BOARD_W + PAD * 2;
const H = BOARD_H + PAD * 2;

async function main() {
  const { root } = await createStage(W, H);
  const board = new DueloBoard();
  board.position.set(PAD, PAD);
  const overlay = new DueloOverlay(W, H);
  root.addChild(board, overlay);

  const game: SlotGame<DueloBonus> = {
    buyPrice: DUELO.buyPrice,
    retrigger: DUELO.retrigger,
    bonusPitch: (t) => PITCH[t],
    rulesHtml,
    createBonus,
    endBonus: () => board.clearVs(),
    async spin(bonus, { bet }) {
      const keep = bonus ? [...bonus.sticky] : [];
      const res = bonus ? bonusSpin(defaultRng, bonus) : baseSpin(defaultRng);
      board.clearVs(keep);
      await board.dropIn(res.grid, keep.map((v) => v.col));
      for (const vs of res.vsReels) {
        if (keep.some((k) => k.col === vs.col)) continue;
        const col = await board.addVs(vs);
        await overlay.duel(vs);
        col.resolve();
      }
      if (res.wins.length) {
        await board.highlight(res.wins.flatMap((w) => w.cells));
        const m = Math.max(...res.wins.map((w) => w.mult));
        const txt = m > 1 ? `${money(res.total * bet)}  (x${m})` : money(res.total * bet);
        overlay.floatText(txt, W / 2, H / 2, 0xffffff, 40);
        await wait(500);
        board.resetAlpha();
      }
      if (res.scatters >= 3) await Promise.all(board.symbolsOf('BONUS').map((s) => s.playWin()));
      return { win: res.total, tier: bonus ? 0 : res.tier };
    },
  };

  new SlotShell(game, overlay);
  // Tablero inicial sin VS.
  await board.dropIn(baseSpin(defaultRng).grid.map((col) => col.map((c) => (c.sym === 'VS' ? { sym: 'WILD' as const } : c))));
}

main();
