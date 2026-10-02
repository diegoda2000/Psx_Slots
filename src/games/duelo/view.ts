import { Container, Graphics, Text } from 'pixi.js';
import { SYMBOLS, type Premium } from '../../shared/symbols';
import { label, multColor, shade } from '../../shared/text';
import { easeOut, tween } from '../../shared/tween';
import { Board, BOARD_H, cellX, cellY } from '../../shared/view/Board';
import { CELL } from '../../shared/view/CodeSymbolVisual';
import { LINES, REEL_CHAR, type WildReel } from './math';

/** Rodillo wild expandido de un personaje, con su multiplicador. */
export class WildReelView extends Container {
  constructor(readonly wild: WildReel) {
    super();
    const color = SYMBOLS[wild.char].color;
    const g = new Graphics();
    g.roundRect(4, 4, CELL - 8, BOARD_H - 8, 14).fill(shade(color, 0.3)).stroke({ width: 5, color });
    g.roundRect(10, 10, CELL - 20, BOARD_H - 20, 10).stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
    this.addChild(g);
    const initial = label(SYMBOLS[wild.char].name[0], 64, color);
    initial.position.set(CELL / 2, 110);
    const name = label(SYMBOLS[wild.char].name.toUpperCase(), 15, 0xffffff);
    name.position.set(CELL / 2, 165);
    const w = label('WILD', 22, 0xffd23e);
    w.position.set(CELL / 2, BOARD_H / 2 + 20);
    const m = label(`x${wild.mult}`, 34, multColor(wild.mult));
    m.position.set(CELL / 2, BOARD_H / 2 + 70);
    this.addChild(initial, name, w, m);
    if (wild.sticky) {
      const fixed = label('FIJO', 12, 0xaaaaaa);
      fixed.position.set(CELL / 2, BOARD_H - 40);
      this.addChild(fixed);
    }
  }

  async pulse() {
    for (let i = 0; i < 2; i++) {
      await tween(this, { alpha: 0.6 }, 120);
      await tween(this, { alpha: 1 }, 120);
    }
  }
}

export class DueloBoard extends Board {
  private reelLayer = new Container();
  private lineLayer = new Graphics();
  private headers = new Map<number, Text>();
  reels: WildReelView[] = [];

  constructor() {
    super({ frame: 0x0d0820, stroke: 0xff3355, colA: 0x150e36, colB: 0x1a1240 });
    this.addChild(this.reelLayer, this.lineLayer);
    // Encima de cada rodillo central, su personaje (como los 4 jinetes).
    REEL_CHAR.forEach((ch, col) => {
      if (!ch) return;
      const t = label(SYMBOLS[ch].name.toUpperCase(), 12, SYMBOLS[ch].color);
      t.position.set(cellX(col), -26);
      this.addChild(t);
      this.headers.set(col, t);
    });
    this.setDeath(null);
  }

  /** Marca los rodillos de la muerte activos. null = fuera del semitocho/tocho. */
  setDeath(active: Premium[] | null) {
    for (const [col, t] of this.headers) {
      const on = !!active?.includes(REEL_CHAR[col]!);
      t.text = `${on ? '☠ ' : ''}${SYMBOLS[REEL_CHAR[col]!].name.toUpperCase()}`;
      t.alpha = active === null ? 0.8 : on ? 1 : 0.4;
      t.scale.set(on ? 1.15 : 1);
    }
  }

  /** Quita los rodillos expandidos salvo los fijos. */
  clearReels(keep: WildReel[] = []) {
    for (const v of [...this.reels]) {
      if (keep.some((k) => k.col === v.wild.col)) continue;
      v.destroy({ children: true });
      this.reels = this.reels.filter((x) => x !== v);
    }
  }

  /** El wild crece desde su celda hasta ocupar todo el rodillo. */
  async expand(w: WildReel) {
    const existing = this.reels.find((v) => v.wild.col === w.col);
    if (existing) return existing;
    const v = new WildReelView(w);
    v.x = w.col * CELL;
    v.y = w.row * CELL;
    v.scale.y = CELL / BOARD_H;
    this.reelLayer.addChild(v);
    this.reels.push(v);
    await tween(v, { y: 0, 'scale.y': 1 }, 380, easeOut);
    for (const s of this.cells[w.col]) s?.destroy({ children: true });
    this.cells[w.col].fill(null);
    return v;
  }

  showLines(lines: number[], lengths: number[]) {
    const g = this.lineLayer;
    g.clear();
    lines.forEach((li, i) => {
      const path = LINES[li].slice(0, lengths[i]);
      g.moveTo(cellX(0), cellY(path[0]));
      path.forEach((r, c) => g.lineTo(cellX(c), cellY(r)));
      g.stroke({ width: 4, color: 0xffd23e, alpha: 0.85, cap: 'round', join: 'round' });
    });
  }

  resetAlpha() {
    super.resetAlpha();
    this.lineLayer.clear();
  }

  protected extraHighlights(cells: [number, number][]) {
    return this.reels.filter((v) => cells.some(([c]) => c === v.wild.col)).map((v) => v.pulse());
  }
}
