import { Assets, Rectangle, Texture } from 'pixi.js';
import type { Premium } from '../../shared/symbols';
import andy from './art/AND.webp';
import iberru from './art/IBE.webp';
import macaco from './art/MAC.webp';

/** Ilustraciones de cuerpo completo (fondo transparente). Elena aún no tiene: usa el arte de código. */
const URLS: Partial<Record<Premium, string>> = { AND: andy, IBE: iberru, MAC: macaco };

/** Recorte del retrato para la celda: cuadrado desde arriba, en fracción del ancho de la imagen. */
const PORTRAIT: Partial<Record<Premium, { x: number; y: number; size: number }>> = {
  AND: { x: 0, y: 0.02, size: 1 },
  IBE: { x: 0, y: 0, size: 1 },
  MAC: { x: 0.04, y: 0, size: 0.92 },
};

const body = new Map<Premium, Texture>();
const portrait = new Map<Premium, Texture>();

export async function loadCharacterArt() {
  for (const [p, url] of Object.entries(URLS) as [Premium, string][]) {
    const tex: Texture = await Assets.load(url);
    body.set(p, tex);
    const c = PORTRAIT[p]!;
    const w = tex.source.width;
    const frame = new Rectangle(c.x * w, c.y * w, c.size * w, c.size * w);
    portrait.set(p, new Texture({ source: tex.source, frame }));
  }
}

export const bodyTexture = (p: Premium) => body.get(p);
export const portraitTexture = (p: Premium) => portrait.get(p);
