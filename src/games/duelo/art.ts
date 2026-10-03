import { Texture } from 'pixi.js';
import type { DueloChar, SymbolId } from '../../shared/symbols';

/**
 * Ilustraciones de Duelo. Basta con dejar el archivo en la carpeta con el id como nombre:
 * - art/<ID>.webp y art/<ID>-face.webp: personaje de cuerpo completo y su retrato (AND, IBE, MAJ, MAC).
 * - art/symbols/<ID>.webp: símbolos de pago (HUTT, TERNASCO, ...) y BONUS (la ficha FS).
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

export const bodyTexture = (p: DueloChar) => textures.get(p);
export const portraitTexture = (p: DueloChar) => textures.get(`${p}-face`);
export const symbolTexture = (s: SymbolId) => textures.get(s);
const urlOf = (files: Record<string, string>, key: string) => Object.entries(files).find(([p]) => keyOf(p) === key)?.[1];
/** URLs para usar las ilustraciones también en el HTML (panel de compra, tabla de pagos). */
export const symbolUrl = (s: SymbolId) => urlOf(SYMBOL_FILES, s);
export const faceUrl = (p: DueloChar) => urlOf(CHARACTER_FILES, `${p}-face`);
export const fsChipUrl = symbolUrl('BONUS');
