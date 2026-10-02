import '../../shared/ui/style.css';
import { createStage, PAD, SlotShell } from '../../shared/game/shell';
import type { SlotGame } from '../../shared/game/types';
import { defaultRng } from '../../shared/rng';
import { money } from '../../shared/text';
import { Board, BOARD_H, BOARD_W } from '../../shared/view/Board';
import { Overlay } from '../../shared/view/Overlay';
import { baseSpin, bonusSpin, createBonus, OLIMPO, type OlimpoBonus } from './math';
import { PITCH, rulesHtml } from './rules';

const W = BOARD_W + PAD * 2;
const H = BOARD_H + PAD * 2;

async function main() {
  const { root } = await createStage(W, H);
  const board = new Board({ frame: 0x0d0820, stroke: 0xff3df2, colA: 0x1a0f3d, colB: 0x22144a });
  board.position.set(PAD, PAD);
  const overlay = new Overlay(W, H);
  root.addChild(board, overlay);

  const game: SlotGame<OlimpoBonus> = {
    buyPrice: OLIMPO.buyPrice,
    bonusPitch: (t) => PITCH[t],
    rulesHtml,
    createBonus,
    bonusInfo: (b) => (b.globalMult > 0 ? ` · Multi x${b.globalMult}` : ''),
    async spin(bonus, { bet, showWin }) {
      const out = bonus ? bonusSpin(defaultRng, bonus) : baseSpin(defaultRng);
      const { res } = out;
      await board.dropIn(res.steps[0]?.grid ?? res.finalGrid);
      let acc = 0;
      for (let i = 0; i < res.steps.length; i++) {
        const step = res.steps[i];
        const cells = step.wins.flatMap((w) => w.cells);
        await board.highlight(cells);
        acc += step.stepWin;
        overlay.floatText(money(step.stepWin * bet), W / 2, H / 2, 0xffffff, 36);
        showWin(acc * bet);
        board.resetAlpha();
        await board.tumble(cells, res.steps[i + 1]?.grid ?? res.finalGrid);
      }
      if (out.appliedMult > 1) {
        await Promise.all(board.symbolsOf('MULT').map((s) => s.playWin()));
        const t = bonus ? `MULTI TOTAL x${out.appliedMult}` : `x${out.appliedMult}`;
        await overlay.floatText(t, W / 2, H / 2 - 40, 0xff3df2, 56);
        await overlay.floatText(money(out.win * bet), W / 2, H / 2 + 20, 0xffffff, 44);
      }
      if (res.scatters >= 3) await Promise.all(board.symbolsOf('BONUS').map((s) => s.playWin()));
      return { win: out.win, tier: bonus ? 0 : res.tier };
    },
  };

  new SlotShell(game, overlay);
  await board.dropIn(baseSpin(defaultRng).res.finalGrid);
}

main();
