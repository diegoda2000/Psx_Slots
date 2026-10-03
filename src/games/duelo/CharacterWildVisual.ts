import { Container, Graphics, Sprite } from 'pixi.js';
import { SYMBOLS, type CharWild, type DueloChar } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, tween } from '../../shared/tween';
import type { SymbolVisual } from '../../shared/view/SymbolVisual';
import { portraitTexture } from './art';
import { INK } from './palette';

const S = 92;
const RAD = 18;

/**
 * Wild de personaje en una celda: retrato en un cuadrado de esquinas redondeadas (como el hueco "por decidir").
 * Sin cartel de WILD. El multiplicador no se ve hasta reveal(), cuando entra en una línea premiada,
 * y sale abajo para no tapar la cara.
 */
export class CharacterWildVisual implements SymbolVisual {
  readonly view = new Container();
  private art = new Container();
  private multTag: Container | null = null;
  private char: DueloChar;

  constructor(sym: CharWild, private mult = 2) {
    this.char = sym.slice(2) as DueloChar;
    const color = SYMBOLS[this.char].color;
    const h = -S / 2;
    const tile = new Graphics().roundRect(h, h, S, S, RAD).fill(INK).stroke({ width: 4, color });
    this.art.addChild(tile);
    const tex = portraitTexture(this.char);
    if (tex) {
      const sp = new Sprite(tex);
      sp.anchor.set(0.5);
      sp.width = sp.height = S - 10;
      const mask = new Graphics().roundRect(h + 5, h + 5, S - 10, S - 10, RAD - 4).fill(0xffffff);
      sp.mask = mask;
      this.art.addChild(sp, mask);
    } else {
      this.art.addChild(label(SYMBOLS[this.char].name[0], 40, color));
    }
    this.view.addChild(this.art);
  }

  async reveal() {
    if (this.multTag) return;
    const c = multColor(this.mult);
    const tag = new Container();
    const bg = new Graphics().roundRect(-30, -13, 60, 26, 8).fill(INK).stroke({ width: 3, color: c });
    tag.addChild(bg, label(`x${this.mult}`, 19, c));
    tag.position.set(0, S / 2 - 10);
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
