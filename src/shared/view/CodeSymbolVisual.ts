import { Container, Graphics } from 'pixi.js';
import { SYMBOLS, type SymbolId } from '../symbols';
import { label, multColor, shade } from '../text';
import { backOut, tween } from '../tween';
import type { SymbolVisual } from './SymbolVisual';

export const CELL = 100;
const S = 90; // tamaño del símbolo dentro de la celda

const INITIAL: Partial<Record<SymbolId, string>> = { AND: 'A', IBE: 'I', ELE: 'E', MAC: 'M' };
const LABEL: Partial<Record<SymbolId, string>> = { AND: 'ANDY', IBE: 'IBERRU', ELE: 'ELENA', MAC: 'MACACO' };

/** Arte provisional dibujado con Graphics. Lo sustituirá el arte final o Spine. */
export class CodeSymbolVisual implements SymbolVisual {
  readonly view = new Container();
  private art = new Container();

  constructor(private sym: SymbolId, private mult?: number) {
    this.view.addChild(this.art);
    this.build();
  }

  private build() {
    const info = SYMBOLS[this.sym];
    const g = new Graphics();
    this.art.addChild(g);
    const h = -S / 2;
    switch (info.kind) {
      case 'low': {
        g.roundRect(h, h, S, S, 18).fill(0x1a1235).stroke({ width: 3, color: info.color, alpha: 0.5 });
        const c = info.color;
        if (this.sym === 'TRI') g.poly([0, -26, 27, 20, -27, 20]).stroke({ width: 9, color: c, join: 'round' });
        if (this.sym === 'CIR') g.circle(0, 0, 25).stroke({ width: 9, color: c });
        if (this.sym === 'CRZ')
          g.moveTo(-22, -22).lineTo(22, 22).moveTo(22, -22).lineTo(-22, 22).stroke({ width: 9, color: c, cap: 'round' });
        if (this.sym === 'CUA') g.rect(-22, -22, 44, 44).stroke({ width: 9, color: c, join: 'round' });
        break;
      }
      case 'high': {
        g.roundRect(h, h, S, S, 16).fill(shade(info.color, 0.45)).stroke({ width: 4, color: info.color });
        g.roundRect(-39, -39, 78, S / 2 - 6, 12).fill({ color: 0xffffff, alpha: 0.12 });
        const big = label(INITIAL[this.sym]!, 46, info.color);
        big.y = -8;
        const small = label(LABEL[this.sym]!, this.sym === 'IBE' || this.sym === 'MAC' ? 14 : 16, 0xffffff);
        small.y = 30;
        this.art.addChild(big, small);
        if (this.sym === 'AND') {
          // Corona: Andy es "el sacarino", el que más paga.
          const crown = new Graphics()
            .poly([-20, -30, -20, -42, -10, -34, 0, -46, 10, -34, 20, -42, 20, -30])
            .fill(0xffe600)
            .stroke({ width: 2, color: 0x7a5200 });
          this.art.addChild(crown);
          big.y = -2;
        }
        break;
      }
      case 'wild':
        g.roundRect(h, h, S, S, 16).fill(0x0b0b0f).stroke({ width: 4, color: 0xffd23e });
        g.roundRect(-40, -40, 80, 80, 12).stroke({ width: 2, color: 0xff3df2, alpha: 0.8 });
        this.art.addChild(label('WILD', 24, 0xffd23e));
        break;
      case 'scatter': {
        g.star(0, -6, 5, 40, 18).fill(0xffd23e).stroke({ width: 3, color: 0xff8800 });
        const t = label('BONUS', 17, 0xffffff);
        t.y = 30;
        this.art.addChild(t);
        break;
      }
      case 'mult': {
        const c = multColor(this.mult ?? 2);
        g.circle(0, 0, 42).fill({ color: c, alpha: 0.25 });
        g.circle(0, 0, 34).fill(shade(c, 0.4)).stroke({ width: 4, color: c });
        g.circle(-10, -12, 9).fill({ color: 0xffffff, alpha: 0.35 });
        this.art.addChild(label(`x${this.mult}`, (this.mult ?? 0) >= 100 ? 20 : 26, 0xffffff));
        break;
      }
      case 'vs':
        g.roundRect(h, h, S, S, 12).fill(0x30101a);
        this.art.addChild(label('VS', 30, 0xff3355));
        break;
    }
  }

  async land() {
    this.art.scale.set(0.85);
    await tween(this.art.scale, { x: 1, y: 1 }, 220, backOut);
  }

  async win() {
    for (let i = 0; i < 2; i++) {
      await tween(this.art.scale, { x: 1.18, y: 1.18 }, 140);
      await tween(this.art.scale, { x: 1, y: 1 }, 140);
    }
  }

  async remove() {
    await tween(this.view, { alpha: 0, 'scale.x': 1.4, 'scale.y': 1.4 }, 200);
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
