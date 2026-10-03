import { Texture } from 'pixi.js';
import type { Premium, SymbolId } from '../../shared/symbols';

/**
 * Ilustraciones de Duelo. Basta con dejar el archivo en la carpeta con el id como nombre:
 * - art/<ID>.webp y art/<ID>-face.webp: personaje de cuerpo completo y su retrato (AND, IBE, ELE, MAC).
 * - art/symbols/<ID>.webp: símbolos de pago (HUTT, DICTADOR, ...) y BONUS (la ficha FS).
 * Lo que no tenga imagen sigue con el arte de código.
 */
const CHARACTER_FILES = import.meta.glob('./art/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const SYMBOL_FILES = import.meta.glob('./art/symbols/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const textures = new Map<string, Texture>();

/**
 * Carga con <img> y no con Assets.load: el visor de artifacts prohíbe fetch() (también de data: URIs),
 * pero sí deja cargar imágenes. Si una falla, ese símbolo sigue con el arte de código.
 */
function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${url.slice(0, 60)}`));
    img.src = url;
  });
}

const keyOf = (path: string) => path.split('/').pop()!.replace('.webp', '');

export async function loadDueloArt() {
  const all = { ...CHARACTER_FILES, ...SYMBOL_FILES };
  await Promise.all(
    Object.entries(all).map(async ([path, url]) => {
      try {
        textures.set(keyOf(path), Texture.from(await loadImage(url)));
      } catch (e) {
        console.warn(e);
      }
    }),
  );
}

export const bodyTexture = (p: Premium) => textures.get(p);
export const portraitTexture = (p: Premium) => textures.get(`${p}-face`);
export const symbolTexture = (s: SymbolId) => textures.get(s);
/** URL de la ficha FS para usarla también en el HTML (panel de compra). */
export const fsChipUrl = Object.entries(SYMBOL_FILES).find(([p]) => keyOf(p) === 'BONUS')?.[1];
