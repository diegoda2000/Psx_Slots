import { Container, Graphics } from 'pixi.js';
import { COLS, ROWS, type Grid } from '../symbols';
import { backOut, easeIn, tween, wait } from '../tween';
import { CELL } from './CodeSymbolVisual';
import { SymbolView } from './SymbolView';

export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
export const cellX = (col: number) => col * CELL + CELL / 2;
export const cellY = (row: number) => row * CELL + CELL / 2;

export interface BoardTheme {
  frame: number;
  stroke: number;
  colA: number;
  colB: number;
}

/** Tablero 6x5 genérico: caída de símbolos, resaltado de premios y cascadas. */
export class Board extends Container {
  cells: (SymbolView | null)[][] = [];
  protected layer = new Container();
  /** Ancho total del tablero (las columnas pueden ser más anchas que altas). */
  readonly bw: number;

  /** cellW: ancho de cada rodillo (por defecto igual que el alto de la celda). */
  constructor(theme: BoardTheme, readonly cellW = CELL) {
    super();
    this.bw = COLS * cellW;
    const bg = new Graphics();
    bg.roundRect(-14, -14, this.bw + 28, BOARD_H + 28, 24).fill(theme.frame).stroke({ width: 4, color: theme.stroke });
    for (let c = 0; c < COLS; c++) bg.rect(c * cellW + 2, 2, cellW - 4, BOARD_H - 4).fill({ color: c % 2 ? theme.colB : theme.colA });
    this.addChild(bg);
    const mask = new Graphics().rect(0, 0, this.bw, BOARD_H).fill(0xffffff);
    this.addChild(mask, this.layer);
    this.layer.mask = mask;
    for (let c = 0; c < COLS; c++) this.cells.push(Array<SymbolView | null>(ROWS).fill(null));
  }

  /** Centro horizontal de un rodillo. */
  colX(col: number) {
    return col * this.cellW + this.cellW / 2;
  }

  protected place(s: SymbolView, col: number, row: number) {
    s.position.set(this.colX(col), cellY(row));
    this.layer.addChild(s);
    this.cells[col][row] = s;
  }

  /** Tira los símbolos actuales hacia abajo y deja caer el nuevo tablero. */
  async dropIn(grid: Grid, keepCols: number[] = []) {
    const out: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      if (keepCols.includes(c)) continue;
      for (let r = 0; r < ROWS; r++) {
        const s = this.cells[c][r];
        if (!s) continue;
        this.cells[c][r] = null;
        out.push(
          wait(c * 40)
            .then(() => tween(s, { y: s.y + BOARD_H + 100 }, 260, easeIn))
            .then(() => s.destroy({ children: true })),
        );
      }
    }
    await wait(120);
    const inn: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      if (keepCols.includes(c)) continue;
      for (let r = 0; r < ROWS; r++) {
        const cell = grid[c][r];
        const s = new SymbolView(cell.sym, cell.mult);
        this.place(s, c, r);
        const y = s.y;
        s.y = y - BOARD_H - 100;
        inn.push(wait(c * 70 + (ROWS - r) * 18).then(() => tween(s, { y }, 300, backOut)));
      }
    }
    await Promise.all([...out, ...inn]);
  }

  /** Resalta las celdas ganadoras y oscurece el resto. */
  async highlight(cells: [number, number][]) {
    const set = new Set(cells.map(([c, r]) => c * 100 + r));
    const anims: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r < ROWS; r++) {
        const s = this.cells[c][r];
        if (!s) continue;
        if (set.has(c * 100 + r)) anims.push(s.playWin());
        else s.alpha = 0.35;
      }
    anims.push(...this.extraHighlights(cells));
    await Promise.all(anims);
  }

  protected extraHighlights(_cells: [number, number][]): Promise<void>[] {
    return [];
  }

  resetAlpha() {
    for (const col of this.cells) for (const s of col) if (s) s.alpha = 1;
  }

  symbolsOf(sym: string) {
    return this.cells.flat().filter((s): s is SymbolView => !!s && s.sym === sym);
  }

  /** Cascada: explotan las celdas ganadoras, bajan las demás y caen nuevas. */
  async tumble(removed: [number, number][], next: Grid) {
    const set = new Set(removed.map(([c, r]) => c * 100 + r));
    await Promise.all(removed.map(([c, r]) => this.cells[c][r]?.playRemove() ?? Promise.resolve()));
    const anims: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      const kept: SymbolView[] = [];
      for (let r = 0; r < ROWS; r++) {
        const s = this.cells[c][r];
        if (!s) continue;
        if (set.has(c * 100 + r)) s.destroy({ children: true });
        else kept.push(s);
      }
      const gap = ROWS - kept.length;
      kept.forEach((s, i) => {
        const row = gap + i;
        this.cells[c][row] = s;
        anims.push(tween(s, { y: cellY(row) }, 260, backOut));
      });
      for (let r = 0; r < gap; r++) {
        const cell = next[c][r];
        const s = new SymbolView(cell.sym, cell.mult);
        this.place(s, c, r);
        s.y = cellY(r) - gap * CELL - 20;
        anims.push(wait(c * 30).then(() => tween(s, { y: cellY(r) }, 300, backOut)));
      }
    }
    await Promise.all(anims);
  }
}
