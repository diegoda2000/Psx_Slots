import { Container, Sprite, type Texture } from 'pixi.js';
import { backOut, easeOut, tween } from '../../shared/tween';
import type { SymbolVisual } from '../../shared/view/SymbolVisual';

const BOX = 92;

/** Símbolo ilustrado sin caja: la imagen flota sobre el rodillo, como en los juegos de Hacksaw. */
export class ImageSymbolVisual implements SymbolVisual {
  readonly view = new Container();
  private sprite: Sprite;

  constructor(tex: Texture, scale = 1) {
    this.sprite = new Sprite(tex);
    this.sprite.anchor.set(0.5);
    const k = (BOX * scale) / Math.max(tex.width, tex.height);
    this.sprite.scale.set(k);
    this.view.addChild(this.sprite);
  }

  async land() {
    const k = this.sprite.scale.x;
    this.sprite.scale.set(k * 1.08, k * 0.9);
    await tween(this.sprite.scale, { x: k, y: k }, 240, backOut);
  }

  async win() {
    const k = this.sprite.scale.x;
    for (let i = 0; i < 2; i++) {
      await tween(this.sprite, { 'scale.x': k * 1.18, 'scale.y': k * 1.18, rotation: i ? -0.06 : 0.06 }, 140, easeOut);
      await tween(this.sprite, { 'scale.x': k, 'scale.y': k, rotation: 0 }, 140, easeOut);
    }
  }

  async remove() {
    await tween(this.view, { alpha: 0 }, 200);
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
