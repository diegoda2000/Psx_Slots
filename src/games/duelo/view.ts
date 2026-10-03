import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { SYMBOLS, type Premium } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, easeOut, tween } from '../../shared/tween';
import { Board, BOARD_H, cellX, cellY } from '../../shared/view/Board';
import { CELL } from '../../shared/view/CodeSymbolVisual';
import { bodyTexture } from './art';
import { LINES, REEL_CHAR, type WildReel } from './math';

/** Rodillo wild expandido: el personaje de cuerpo completo; el multiplicador sale al terminar de desplegarse. */
export class WildReelView extends Container {
  private frame = new Graphics();
  private clip = new Graphics();
  private content = new Container();
  private multTag: Container;
  private top = 0;
  private bottom = BOARD_H;

  constructor(readonly wild: WildReel) {
    super();
    const color = SYMBOLS[wild.char].color;
    this.addChild(this.frame, this.content, this.clip);
    this.content.mask = this.clip;

    const glow = new Graphics().rect(4, 4, CELL - 8, BOARD_H - 8).fill({ color, alpha: 0.18 });
    this.content.addChild(glow);
    const tex = bodyTexture(wild.char);
    if (tex) {
      // Cuerpo completo ocupando casi todo el rodillo (se recortan los lados con la máscara).
      const sp = new Sprite(tex);
      sp.anchor.set(0.5, 1);
      sp.scale.set((BOARD_H - 16) / tex.height);
      sp.position.set(CELL / 2, BOARD_H - 6);
      this.content.addChild(sp);
    } else {
      const initial = label(SYMBOLS[wild.char].name[0], 64, color);
      initial.position.set(CELL / 2, BOARD_H / 2);
      this.content.addChild(initial);
    }
    // Rótulo abajo, sobre las piernas.
    const band = new Graphics().rect(4, BOARD_H - 58, CELL - 8, 54).fill({ color: 0x000000, alpha: 0.55 });
    const w = label(wild.sticky ? 'WILD FIJO' : 'WILD', wild.sticky ? 15 : 20, 0xffd23e);
    w.position.set(CELL / 2, BOARD_H - 40);
    const name = label(SYMBOLS[wild.char].name.toUpperCase(), 13, 0xffffff);
    name.position.set(CELL / 2, BOARD_H - 18);
    this.content.addChild(band, w, name);

    // Multiplicador sobre el pecho; solo aparece al terminar de desplegarse.
    this.multTag = new Container();
    const mc = multColor(wild.mult);
    const badge = new Graphics().roundRect(-42, -26, 84, 52, 14).fill({ color: 0x000000, alpha: 0.75 }).stroke({ width: 3, color: mc });
    this.multTag.addChild(badge, label(`x${wild.mult}`, 34, mc));
    this.multTag.position.set(CELL / 2, BOARD_H * 0.55);
    this.multTag.visible = false;
    this.addChild(this.multTag);
    this.redraw();
  }

  /** Dibuja marco y máscara entre top y bottom (para la animación de despliegue). */
  private redraw() {
    const color = SYMBOLS[this.wild.char].color;
    const h = this.bottom - this.top;
    this.frame.clear();
    this.frame.roundRect(4, this.top + 4, CELL - 8, h - 8, 14).fill(0x0b0b14).stroke({ width: 5, color });
    this.clip.clear();
    this.clip.roundRect(6, this.top + 6, CELL - 12, h - 12, 12).fill(0xffffff);
  }

  /** Despliegue desde la celda donde cayó: el cuerpo va apareciendo según se abre la columna. */
  async unfold(row: number, ms: number) {
    this.top = row * CELL;
    this.bottom = (row + 1) * CELL;
    this.redraw();
    await tween(this, { top: 0, bottom: BOARD_H }, ms, easeOut, () => this.redraw());
  }

  async showMult() {
    this.multTag.visible = true;
    this.multTag.scale.set(0);
    await tween(this.multTag.scale, { x: 1, y: 1 }, 300, backOut);
  }

  async pulse() {
    for (let i = 0; i < 2; i++) {
      await tween(this.content, { alpha: 0.6 }, 120);
      await tween(this.content, { alpha: 1 }, 120);
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

  /** El wild crece desde su celda hasta ocupar el rodillo; luego aparece el multiplicador. */
  async expand(w: WildReel) {
    const existing = this.reels.find((v) => v.wild.col === w.col);
    if (existing) return existing;
    const v = new WildReelView(w);
    v.x = w.col * CELL;
    this.reelLayer.addChild(v);
    this.reels.push(v);
    for (const s of this.cells[w.col]) s?.destroy({ children: true });
    this.cells[w.col].fill(null);
    await v.unfold(w.row, 520);
    await v.showMult();
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
