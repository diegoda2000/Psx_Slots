import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { COLS, ROWS, SYMBOLS, type Cell, type DueloChar, type Grid } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, easeOut, speed, tween } from '../../shared/tween';
import { Board, BOARD_H, cellY } from '../../shared/view/Board';
import { CELL } from '../../shared/view/CodeSymbolVisual';
import { SymbolView } from '../../shared/view/SymbolView';

/** Rodillos de Duelo un 18% más anchos que altos, para que quepan los personajes desplegados. */
export const CELL_W = 118;

import { sfx } from '../../shared/sfx';
import { bodyTexture } from './art';
import { DUELO_PAYS, LINES, REEL_CHAR, type WildReel } from './math';
import { GOLD, INK, REEL_A, REEL_B, STICKER, YELLOW } from './palette';

/** Giro de rodillo: velocidad constante y frenada suave al final (sin rebote). */
const SPIN_K = 0.8;
const SPIN_V = 2 / (1 + SPIN_K);
const spinEase = (p: number) =>
  p < SPIN_K ? SPIN_V * p : SPIN_V * SPIN_K + (1 - SPIN_V * SPIN_K) * (1 - (1 - (p - SPIN_K) / (1 - SPIN_K)) ** 2);

/** Rodillo wild expandido: el personaje de cuerpo completo; el multiplicador sale al terminar de desplegarse. */
export class WildReelView extends Container {
  private frame = new Graphics();
  private clip = new Graphics();
  private content = new Container();
  /** El cuerpo del personaje, recortado al rodillo. */
  private figure = new Container();
  private figClip = new Graphics();
  private multTag: Container;
  private top = 0;
  private bottom = BOARD_H;

  constructor(readonly wild: WildReel) {
    super();
    const color = SYMBOLS[wild.char].color;
    this.addChild(this.frame, this.content, this.clip, this.figure, this.figClip);
    this.content.mask = this.clip;
    this.figure.mask = this.figClip;

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
    this.addChild(this.reelLayer, this.lineLayer);
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

  /**
   * Tirada: los rodillos giran (la tira de símbolos baja sin parar) y se paran uno a uno, con el ritmo de Hacksaw
   * medido en la grabación del usuario: el primero a los 0,80 s y luego uno cada 0,33 s. Sin rebote al parar.
   * Sin `spin` (tablero de reposo) o en super turbo, la caída de siempre.
   */
  async dropIn(grid: Grid, keepCols: number[] = [], spin = false) {
    if (!spin || this.allAtOnce) return super.dropIn(grid, keepCols);
    const reels: Promise<void>[] = [];
    // Turbo con su propio ritmo (lo pidió el usuario): primero a los 0,60 s y luego uno cada 0,18 s.
    // (los tiempos se multiplican por speed.factor porque tween ya los divide entre él).
    const [first, gap] = speed.factor > 1 ? [600 * speed.factor, 180 * speed.factor] : [800, 330];
    for (let c = 0; c < COLS; c++) if (!keepCols.includes(c)) reels.push(this.spinReel(c, grid[c], first + c * gap));
    await Promise.all(reels);
  }

  /** Un rodillo: abajo los símbolos que había, encima relleno al azar y arriba del todo los finales; la tira baja entera. */
  private async spinReel(c: number, col: Cell[], ms: number) {
    const strip = new Container();
    this.layer.addChild(strip);
    for (let r = 0; r < ROWS; r++) {
      const s = this.cells[c][r];
      this.cells[c][r] = null;
      if (s) strip.addChild(s);
      else {
        // Rodillo que estaba desplegado (sus celdas ya no existen): se rellena para que no gire vacío.
        const f = new SymbolView(DUELO_PAYS[Math.floor(Math.random() * DUELO_PAYS.length)]);
        f.position.set(this.colX(c), cellY(r));
        strip.addChild(f);
      }
    }
    // Relleno para que la velocidad sea la misma en todos los rodillos (~2,5 px/ms en la parte constante).
    const fill = Math.max(3, Math.round((2.5 * ms) / (SPIN_V * CELL)) - ROWS);
    for (let i = 1; i <= fill; i++) {
      const s = new SymbolView(DUELO_PAYS[Math.floor(Math.random() * DUELO_PAYS.length)]);
      s.position.set(this.colX(c), cellY(0) - i * CELL);
      strip.addChild(s);
    }
    const finals = col.map((cell, r) => {
      const s = new SymbolView(cell.sym, cell.mult);
      s.position.set(this.colX(c), cellY(r) - (fill + ROWS) * CELL);
      strip.addChild(s);
      return s;
    });
    await tween(strip, { y: (fill + ROWS) * CELL }, ms, spinEase);
    finals.forEach((s, r) => this.place(s, c, r));
    strip.destroy({ children: true });
    this.onColumnLand?.(c);
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
    // El rodillo desplegado tapa todo lo que había, también la ficha FS (ya se ha enseñado antes lo que daba).
    for (const s of this.cells[w.col]) s?.destroy({ children: true });
    this.cells[w.col].fill(null);
    sfx.expand();
    await v.unfold(w.row, 520);
    sfx.mult();
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
