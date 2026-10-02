import { Container, Graphics } from 'pixi.js';
import { SYMBOLS, ROWS, type PaySymbol } from '../../shared/symbols';
import { label, multColor, shade } from '../../shared/text';
import { backOut, tween, wait } from '../../shared/tween';
import { Board, BOARD_H } from '../../shared/view/Board';
import { CELL } from '../../shared/view/CodeSymbolVisual';
import { Overlay } from '../../shared/view/Overlay';
import type { VsReel } from './math';

/** Columna VS: dos personajes enfrentados; al resolverse queda como WILD con multiplicador. */
export class VsColumn extends Container {
  constructor(readonly vs: VsReel) {
    super();
    const g = new Graphics();
    g.roundRect(4, 4, CELL - 8, BOARD_H - 8, 14).fill(0x1a0710).stroke({ width: 4, color: 0xff3355 });
    g.poly([8, 8, 92, 8, 92, BOARD_H / 2 - 30, 8, BOARD_H / 2 + 30]).fill({ color: 0xff3355, alpha: 0.35 });
    g.poly([8, BOARD_H / 2 + 30, 92, BOARD_H / 2 - 30, 92, BOARD_H - 8, 8, BOARD_H - 8]).fill({ color: 0x3d7bff, alpha: 0.35 });
    this.addChild(g);
    const [a, b] = vs.fighters;
    const ta = label(SYMBOLS[a].name.toUpperCase(), 14, SYMBOLS[a].color);
    ta.position.set(50, 70);
    const tb = label(SYMBOLS[b].name.toUpperCase(), 14, SYMBOLS[b].color);
    tb.position.set(50, BOARD_H - 70);
    const v = label('VS', 34, 0xffffff);
    v.position.set(50, BOARD_H / 2);
    this.addChild(ta, tb, v);
  }

  resolve() {
    const who = this.vs.fighters[this.vs.winner];
    this.removeChildren().forEach((c) => c.destroy({ children: true }));
    const color = SYMBOLS[who].color;
    const g = new Graphics();
    g.roundRect(4, 4, CELL - 8, BOARD_H - 8, 14).fill(shade(color, 0.35)).stroke({ width: 5, color });
    g.roundRect(10, 10, 80, BOARD_H - 20, 10).stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
    this.addChild(g);
    const name = label(SYMBOLS[who].name.toUpperCase(), 15, 0xffffff);
    name.position.set(50, 60);
    const wild = label('WILD', 22, 0xffd23e);
    wild.position.set(50, BOARD_H / 2 - 40);
    const m = label(`x${this.vs.mult}`, 34, multColor(this.vs.mult));
    m.position.set(50, BOARD_H / 2 + 20);
    this.addChild(name, wild, m);
    if (this.vs.sticky) {
      const fixed = label('FIJO', 12, 0xaaaaaa);
      fixed.position.set(50, BOARD_H - 40);
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
  private vsLayer = new Container();
  vsViews: VsColumn[] = [];

  constructor() {
    super({ frame: 0x0d0820, stroke: 0xff3355, colA: 0x150e36, colB: 0x1a1240 });
    this.addChild(this.vsLayer);
  }

  /** Quita las columnas VS salvo las fijas. */
  clearVs(keep: VsReel[] = []) {
    for (const v of [...this.vsViews]) {
      if (keep.some((k) => k.col === v.vs.col)) continue;
      v.destroy({ children: true });
      this.vsViews = this.vsViews.filter((x) => x !== v);
    }
  }

  async addVs(vs: VsReel) {
    const existing = this.vsViews.find((v) => v.vs.col === vs.col);
    if (existing) return existing;
    for (let r = 0; r < ROWS; r++) {
      this.cells[vs.col][r]?.destroy({ children: true });
      this.cells[vs.col][r] = null;
    }
    const v = new VsColumn(vs);
    v.x = vs.col * CELL;
    v.y = -BOARD_H;
    this.vsLayer.addChild(v);
    this.vsViews.push(v);
    await tween(v, { y: 0 }, 350, backOut);
    return v;
  }

  protected extraHighlights(cells: [number, number][]) {
    return this.vsViews.filter((v) => cells.some(([c]) => c === v.vs.col)).map((v) => v.pulse());
  }
}

/** Overlay de Duelo: añade la pelea a pantalla completa del VS. */
export class DueloOverlay extends Overlay {
  async duel(vs: VsReel) {
    await tween(this.dim(0.75), { alpha: 1 }, 150);
    const [a, b] = vs.fighters;
    const left = this.fighterCard(a, 0xff3355);
    const right = this.fighterCard(b, 0x3d7bff);
    left.position.set(-150, this.h / 2);
    right.position.set(this.w + 150, this.h / 2);
    const v = label('VS', 70, 0xffffff);
    v.position.set(this.w / 2, this.h / 2);
    v.scale.set(0);
    this.addChild(left, right, v);
    await Promise.all([
      tween(left, { x: this.w / 2 - 150 }, 350, backOut),
      tween(right, { x: this.w / 2 + 150 }, 350, backOut),
    ]);
    await tween(v.scale, { x: 1, y: 1 }, 250, backOut);
    for (let i = 0; i < 6; i++) {
      left.x += i % 2 ? -12 : 12;
      right.x += i % 2 ? 12 : -12;
      await wait(70);
    }
    const winner = vs.winner === 0 ? left : right;
    const loser = vs.winner === 0 ? right : left;
    await Promise.all([tween(loser, { alpha: 0.15, 'scale.x': 0.8, 'scale.y': 0.8 }, 250), tween(v, { alpha: 0 }, 200)]);
    await tween(winner, { x: this.w / 2, 'scale.x': 1.2, 'scale.y': 1.2 }, 300, backOut);
    const m = label(`x${vs.mult}`, 80, multColor(vs.mult));
    m.position.set(this.w / 2, this.h / 2 + 140);
    m.scale.set(0);
    this.addChild(m);
    await tween(m.scale, { x: 1, y: 1 }, 300, backOut);
    await wait(650);
    await this.clear();
  }

  private fighterCard(sym: PaySymbol, side: number) {
    const c = new Container();
    const color = SYMBOLS[sym].color;
    const g = new Graphics().roundRect(-110, -140, 220, 280, 20).fill(0x120a24).stroke({ width: 6, color: side });
    g.roundRect(-96, -126, 192, 252, 14).stroke({ width: 3, color });
    const big = label(SYMBOLS[sym].name[0], 120, color);
    big.y = -20;
    const name = label(SYMBOLS[sym].name.toUpperCase(), 28, 0xffffff);
    name.y = 95;
    c.addChild(g, big, name);
    return c;
  }
}
