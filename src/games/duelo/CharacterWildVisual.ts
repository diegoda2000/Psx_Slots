import { Container, Graphics, Sprite } from 'pixi.js';
import { SYMBOLS, type CharWild, type DueloChar } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, tween } from '../../shared/tween';
import type { SymbolVisual } from '../../shared/view/SymbolVisual';
import { portraitTexture } from './art';
import { INK, STICKER, YELLOW } from './palette';

const R = 40;

/**
 * Wild de personaje en una celda: retrato en una ficha redonda (como la ficha FS) y la cinta WILD.
 * El multiplicador no se ve hasta reveal(), cuando el wild entra en una línea premiada.
 */
export class CharacterWildVisual implements SymbolVisual {
  readonly view = new Container();
  private art = new Container();
  private multTag: Container | null = null;
  private char: DueloChar;

  constructor(sym: CharWild, private mult = 2) {
    this.char = sym.slice(2) as DueloChar;
    const color = SYMBOLS[this.char].color;
    const chip = new Graphics()
      .circle(0, -4, R + 4)
      .fill(INK)
      .circle(0, -4, R)
      .fill(color)
      .circle(0, -4, R - 6)
      .fill(INK);
    this.art.addChild(chip);
    const tex = portraitTexture(this.char);
    if (tex) {
      const sp = new Sprite(tex);
      sp.anchor.set(0.5);
      sp.width = sp.height = (R - 6) * 2;
      sp.y = -4;
      const mask = new Graphics().circle(0, -4, R - 6).fill(0xffffff);
      sp.mask = mask;
      this.art.addChild(sp, mask);
    } else {
      const big = label(SYMBOLS[this.char].name[0], 40, color);
      big.y = -4;
      this.art.addChild(big);
    }
    // Cinta WILD, estilo pegatina.
    const ribbon = new Graphics().roundRect(-30, 24, 60, 20, 6).fill(YELLOW).stroke({ width: 3, color: INK });
    const w = label('WILD', 15, INK, { stroke: { color: STICKER, width: 0 } });
    w.y = 35;
    this.art.addChild(ribbon, w);
    this.view.addChild(this.art);
  }

  async reveal() {
    if (this.multTag) return;
    const c = multColor(this.mult);
    const tag = new Container();
    const bg = new Graphics().roundRect(-30, -17, 60, 34, 12).fill(INK).stroke({ width: 3, color: c });
    tag.addChild(bg, label(`x${this.mult}`, 24, c));
    tag.position.set(0, -4);
    tag.scale.set(0);
    this.multTag = tag;
    this.view.addChild(tag);
    await tween(tag.scale, { x: 1, y: 1 }, 260, backOut);
  }

  async land() {
    this.art.scale.set(0.85);
    await tween(this.art.scale, { x: 1, y: 1 }, 220, backOut);
  }

  async win() {
    for (let i = 0; i < 2; i++) {
      await tween(this.art.scale, { x: 1.12, y: 1.12 }, 140);
      await tween(this.art.scale, { x: 1, y: 1 }, 140);
    }
  }

  async remove() {
    await tween(this.view, { alpha: 0 }, 200);
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
