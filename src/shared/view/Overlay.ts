import { Container, Graphics } from 'pixi.js';
import { label, theme } from '../text';
import { backOut, tween, wait } from '../tween';

/** Capa de pantallas encima del tablero: banners, big wins, textos flotantes. */
export class Overlay extends Container {
  constructor(readonly w: number, readonly h: number) {
    super();
  }

  dim(alpha = 0.7) {
    const g = new Graphics().rect(0, 0, this.w, this.h).fill({ color: 0x000000, alpha });
    g.alpha = 0;
    this.addChild(g);
    return g;
  }

  protected async clear() {
    await tween(this, { alpha: 0 }, 200);
    this.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.alpha = 1;
  }

  async banner(title: string, sub: string, color = theme.gold, ms = 2600) {
    const bg = this.dim(0.8);
    bg.eventMode = 'static';
    const t = label(title, 64, color);
    t.position.set(this.w / 2, this.h / 2 - 40);
    const s = label(sub, 28, 0xffffff, { wordWrap: true, wordWrapWidth: this.w - 60 });
    s.position.set(this.w / 2, this.h / 2 + 40);
    const hint = label('toca para continuar', 14, 0xaaaaaa);
    hint.position.set(this.w / 2, this.h - 40);
    t.scale.set(0);
    this.addChild(t, s, hint);
    await tween(bg, { alpha: 1 }, 150);
    await tween(t.scale, { x: 1, y: 1 }, 400, backOut);
    await new Promise<void>((resolve) => {
      const id = setTimeout(resolve, ms);
      bg.once('pointertap', () => {
        clearTimeout(id);
        resolve();
      });
    });
    await this.clear();
  }

  async bigWin(title: string, amount: number, phrase: string, fmt: (v: number) => string) {
    const bg = this.dim(0.75);
    const t = label(title, 58, theme.gold);
    t.position.set(this.w / 2, this.h / 2 - 70);
    const n = label(fmt(0), 54, 0xffffff);
    n.position.set(this.w / 2, this.h / 2 + 10);
    const p = label(phrase, 26, theme.hot, { wordWrap: true, wordWrapWidth: this.w - 60 });
    p.position.set(this.w / 2, this.h / 2 + 90);
    p.alpha = 0;
    t.scale.set(0);
    this.addChild(t, n, p);
    await tween(bg, { alpha: 1 }, 150);
    await tween(t.scale, { x: 1, y: 1 }, 400, backOut);
    const counter = { v: 0 };
    const id = setInterval(() => (n.text = fmt(counter.v)), 30);
    await tween(counter, { v: amount }, 1600);
    clearInterval(id);
    n.text = fmt(amount);
    await tween(p, { alpha: 1 }, 200);
    await wait(1400);
    await this.clear();
  }

  async floatText(text: string, x: number, y: number, color = 0xffffff, size = 36) {
    const t = label(text, size, color);
    t.position.set(x, y);
    t.scale.set(0.3);
    this.addChild(t);
    await tween(t.scale, { x: 1, y: 1 }, 250, backOut);
    await wait(500);
    await tween(t, { y: y - 40, alpha: 0 }, 300);
    t.destroy();
  }
}
