import { Container, Graphics, Sprite } from 'pixi.js';
import { SYMBOLS, type CharWild, type Premium } from '../../shared/symbols';
import { label, multColor } from '../../shared/text';
import { backOut, tween } from '../../shared/tween';
import type { SymbolVisual } from '../../shared/view/SymbolVisual';
import { portraitTexture } from './art';

const S = 90;

/**
 * Wild de personaje en una celda: solo el retrato, sin multiplicador.
 * El multiplicador sale con reveal() cuando el wild entra en una línea premiada.
 */
export class CharacterWildVisual implements SymbolVisual {
  readonly view = new Container();
  private art = new Container();
  private multTag: Container | null = null;
  private char: Premium;

  constructor(sym: CharWild, private mult = 2) {
    this.char = sym.slice(2) as Premium;
    const color = SYMBOLS[this.char].color;
    const g = new Graphics().roundRect(-S / 2, -S / 2, S, S, 16).fill(0x0b0b0f).stroke({ width: 5, color });
    this.art.addChild(g);
    const tex = portraitTexture(this.char);
    if (tex) {
      const sp = new Sprite(tex);
      sp.anchor.set(0.5);
      sp.width = sp.height = S - 8;
      const mask = new Graphics().roundRect(-S / 2 + 4, -S / 2 + 4, S - 8, S - 8, 12).fill(0xffffff);
      sp.mask = mask;
      this.art.addChild(sp, mask);
    } else {
      const big = label(SYMBOLS[this.char].name[0], 44, color);
      big.y = -8;
      this.art.addChild(big);
    }
    const w = label('WILD', 13, 0xffd23e);
    w.y = S / 2 - 12;
    this.art.addChild(w);
    this.view.addChild(this.art);
  }

  async reveal() {
    if (this.multTag) return;
    const tag = new Container();
    const bg = new Graphics().roundRect(-26, -15, 52, 30, 10).fill(0x000000).stroke({ width: 2, color: multColor(this.mult) });
    tag.addChild(bg, label(`x${this.mult}`, 20, multColor(this.mult)));
    tag.position.set(0, 4);
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
