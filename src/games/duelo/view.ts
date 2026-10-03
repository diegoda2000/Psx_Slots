import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { SYMBOLS, type DueloChar } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, easeOut, tween } from '../../shared/tween';
import { Board, BOARD_H, cellY } from '../../shared/view/Board';
import { CELL } from '../../shared/view/CodeSymbolVisual';

/** Rodillos de Duelo un 18% más anchos que altos, para que quepan los personajes desplegados. */
export const CELL_W = 118;

import { bodyTexture } from './art';
import { LINES, REEL_CHAR, type WildReel } from './math';
import { GOLD, INK, REEL_A, REEL_B, STICKER, YELLOW } from './palette';

/** Rodillo wild expandido: el personaje de cuerpo completo; el multiplicador sale al terminar de desplegarse. */
export class WildReelView extends Container {
  private frame = new Graphics();
  private clip = new Graphics();
  private content = new Container();
  /** El cuerpo va aparte de los rótulos; los dos se recortan al rodillo. */
  private figure = new Container();
  private figClip = new Graphics();
  private labels = new Container();
  private labelClip = new Graphics();
  private multTag: Container;
  private top = 0;
  private bottom = BOARD_H;

  constructor(readonly wild: WildReel) {
    super();
    const color = SYMBOLS[wild.char].color;
    this.addChild(this.frame, this.content, this.clip, this.figure, this.figClip, this.labels, this.labelClip);
    this.content.mask = this.clip;
    this.figure.mask = this.figClip;
    this.labels.mask = this.labelClip;

    // Foco de luz detrás del personaje, del color de su ficha.
    const glow = new Graphics();
    for (let i = 0; i < 6; i++) glow.ellipse(CELL_W / 2, BOARD_H * 0.62, 30 + i * 14, 90 + i * 40).fill({ color, alpha: 0.07 });
    this.content.addChild(glow);
    const tex = bodyTexture(wild.char);
    if (tex) {
      // Cuerpo completo: ~70% del alto del rodillo para que se aprecie la complexión de cada uno.
      const sp = new Sprite(tex);
      sp.anchor.set(0.5, 1);
      sp.scale.set((BOARD_H * 0.7) / tex.height);
      sp.position.set(CELL_W / 2, BOARD_H - 6);
      this.figure.addChild(sp);
    } else {
      const initial = label(SYMBOLS[wild.char].name[0], 64, color);
      initial.position.set(CELL_W / 2, BOARD_H / 2);
      this.figure.addChild(initial);
    }
    // Abajo solo el nombre (sin cartel de WILD).
    const band = new Graphics().rect(4, BOARD_H - 34, CELL_W - 8, 30).fill({ color: INK, alpha: 0.7 });
    const name = label(SYMBOLS[wild.char].name.toUpperCase(), 14, color);
    name.position.set(CELL_W / 2, BOARD_H - 18);
    this.labels.addChild(band, name);

    // Multiplicador encima de la cabeza; solo aparece al terminar de desplegarse.
    this.multTag = new Container();
    const mc = multColor(wild.mult);
    const badge = new Graphics().roundRect(-42, -26, 84, 52, 14).fill(INK).stroke({ width: 4, color: mc });
    this.multTag.addChild(badge, label(`x${wild.mult}`, 36, mc));
    this.multTag.position.set(CELL_W / 2, BOARD_H * 0.15);
    this.multTag.visible = false;
    this.addChild(this.multTag);
    this.redraw();
  }

  /** Dibuja marco y máscara entre top y bottom (para la animación de despliegue). */
  private redraw() {
    const color = SYMBOLS[this.wild.char].color;
    const h = this.bottom - this.top;
    this.frame.clear();
    this.frame.roundRect(3, this.top + 3, CELL_W - 6, h - 6, 14).fill(INK).stroke({ width: 4, color: STICKER });
    this.frame.roundRect(8, this.top + 8, CELL_W - 16, h - 16, 10).stroke({ width: 3, color });
    this.clip.clear();
    this.clip.roundRect(10, this.top + 10, CELL_W - 20, h - 20, 9).fill(0xffffff);
    this.figClip.clear();
    this.figClip.roundRect(10, this.top + 10, CELL_W - 20, h - 20, 9).fill(0xffffff);
    this.labelClip.clear();
    this.labelClip.roundRect(10, this.top + 10, CELL_W - 20, h - 20, 9).fill(0xffffff);
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
      await tween(this, { alpha: 0.75 }, 120);
      await tween(this, { alpha: 1 }, 120);
    }
  }
}

export class DueloBoard extends Board {
  private reelLayer = new Container();
  private topLayer = new Container();
  private lineLayer = new Graphics();
  private headers = new Map<number, Text>();
  reels: WildReelView[] = [];

  constructor() {
    super({ frame: INK, stroke: GOLD, colA: REEL_A, colB: REEL_B }, CELL_W);
    // Borde de pegatina recortada, como el de las ilustraciones.
    const sticker = new Graphics()
      .roundRect(-24, -24, this.bw + 48, BOARD_H + 48, 32)
      .fill(INK)
      .roundRect(-20, -20, this.bw + 40, BOARD_H + 40, 28)
      .fill(STICKER);
    this.addChildAt(sticker, 0);
    // Capa por encima de los rodillos desplegados (fichas FS), recortada al tablero.
    const topMask = new Graphics().rect(0, 0, this.bw, BOARD_H).fill(0xffffff);
    this.topLayer.mask = topMask;
    this.addChild(this.reelLayer, topMask, this.topLayer, this.lineLayer);
    // Encima de cada rodillo central, su personaje (como los 4 jinetes).
    REEL_CHAR.forEach((ch, col) => {
      if (!ch) return;
      const t = label(SYMBOLS[ch].name.toUpperCase(), 15, SYMBOLS[ch].color);
      t.position.set(this.colX(col), -42);
      this.addChild(t);
      this.headers.set(col, t);
    });
    this.setDeath(null);
  }

  /** Marca los rodillos de la muerte activos. null = fuera del semitocho/tocho. */
  setDeath(active: DueloChar[] | null) {
    for (const [col, t] of this.headers) {
      const on = !!active?.includes(REEL_CHAR[col]!);
      t.text = `${on ? '☠ ' : ''}${SYMBOLS[REEL_CHAR[col]!].name.toUpperCase()}`;
      t.alpha = active === null ? 0.8 : on ? 1 : 0.4;
      t.scale.set(on ? 1.15 : 1);
    }
  }

  /** Quita los rodillos expandidos. */
  clearReels() {
    for (const v of this.reels) v.destroy({ children: true });
    this.reels = [];
  }

  /** El wild crece desde su celda hasta ocupar el rodillo; luego aparece el multiplicador. */
  async expand(w: WildReel) {
    const existing = this.reels.find((v) => v.wild.col === w.col);
    if (existing) return existing;
    const v = new WildReelView(w);
    v.x = w.col * CELL_W;
    this.reelLayer.addChild(v);
    this.reels.push(v);
    // La ficha FS de ese rodillo sigue contando: se queda visible encima del personaje.
    this.cells[w.col].forEach((s, r) => {
      if (!s) return;
      if (s.sym === 'BONUS') {
        this.topLayer.addChild(s);
      } else {
        s.destroy({ children: true });
        this.cells[w.col][r] = null;
      }
    });
    await v.unfold(w.row, 520);
    await v.showMult();
    return v;
  }

  showLines(lines: number[], lengths: number[]) {
    const g = this.lineLayer;
    g.clear();
    lines.forEach((li, i) => {
      const path = LINES[li].slice(0, lengths[i]);
      for (const [width, color] of [
        [10, INK],
        [5, YELLOW],
      ] as const) {
        g.moveTo(this.colX(0), cellY(path[0]));
        path.forEach((r, c) => g.lineTo(this.colX(c), cellY(r)));
        g.stroke({ width, color, cap: 'round', join: 'round' });
      }
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
