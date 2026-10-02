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
      case 'item': {
        // Altos provisionales de Duelo: objetos de PlayStation.
        const c = info.color;
        g.roundRect(h, h, S, S, 16).fill(0x22263a).stroke({ width: 4, color: c });
        if (this.sym === 'DISCO') {
          g.circle(0, -8, 27).fill(0xd8dde8).stroke({ width: 2, color: 0x7d86a0 });
          g.circle(0, -8, 22).fill({ color: 0x9a7dff, alpha: 0.35 });
          g.circle(0, -8, 7).fill(0x22263a);
        }
        if (this.sym === 'MEMO') {
          g.poly([-18, -36, 12, -36, 20, -28, 20, 18, -18, 18]).fill(0x5b6fd8).stroke({ width: 2, color: 0xdfe4ff });
          g.rect(-12, -30, 24, 14).fill(0xdfe4ff);
          for (let i = 0; i < 5; i++) g.rect(-14 + i * 7, 10, 4, 6).fill(0xffd23e);
        }
        if (this.sym === 'MANDO') {
          g.roundRect(-34, -24, 68, 30, 14).fill(0xb0b8c8).stroke({ width: 2, color: 0x5d6578 });
          g.roundRect(-30, -6, 18, 22, 8).fill(0xb0b8c8).stroke({ width: 2, color: 0x5d6578 });
          g.roundRect(12, -6, 18, 22, 8).fill(0xb0b8c8).stroke({ width: 2, color: 0x5d6578 });
          g.rect(-24, -14, 12, 4).fill(0x3a3f50).rect(-20, -18, 4, 12).fill(0x3a3f50);
          g.circle(16, -16, 3).fill(0x3ee0a0).circle(23, -10, 3).fill(0xff5868).circle(16, -4, 3).fill(0x6aa8ff).circle(9, -10, 3).fill(0xff7ad9);
        }
        if (this.sym === 'CONSOLA') {
          g.roundRect(-34, -30, 68, 40, 6).fill(0xd6dae3).stroke({ width: 2, color: 0x7d86a0 });
          g.circle(8, -12, 13).fill(0xc2c7d2).stroke({ width: 2, color: 0x7d86a0 });
          g.rect(-28, 2, 12, 4).fill(0x6aa8ff).rect(-26, -24, 14, 4).fill(0x3ee0a0);
        }
        const t = label(this.sym === 'MEMO' ? 'MEMORY' : info.name.toUpperCase(), 14, 0xffffff);
        t.y = 32;
        this.art.addChild(t);
        break;
      }
      case 'cwild': {
        // Wild multiplicador de un personaje: inicial, WILD y su multiplicador.
        const ch = this.sym.slice(2) as SymbolId;
        g.roundRect(h, h, S, S, 16).fill(0x0b0b0f).stroke({ width: 5, color: info.color });
        g.roundRect(-39, -39, 78, 78, 12).stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
        const big = label(INITIAL[ch]!, 30, info.color);
        big.y = -22;
        const w = label('WILD', 15, 0xffffff);
        w.y = 4;
        const m = label(`x${this.mult}`, 20, multColor(this.mult ?? 2));
        m.y = 28;
        this.art.addChild(big, w, m);
        break;
      }
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
