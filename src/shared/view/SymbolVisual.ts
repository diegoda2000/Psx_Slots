import type { Container } from 'pixi.js';
import type { SymbolId } from '../symbols';

/**
 * Lo que necesita el tablero de un símbolo. Hoy lo implementa el arte provisional
 * hecho con código (CodeSymbolVisual). Para Spine basta con otra implementación
 * que reproduzca las animaciones "land", "win", "remove" e "idle" del esqueleto
 * y registrarla con registerSymbolVisual(). Ver docs/SPINE.md.
 */
export interface SymbolVisual {
  readonly view: Container;
  land(): Promise<void>;
  win(): Promise<void>;
  remove(): Promise<void>;
  destroy(): void;
}

export type SymbolVisualFactory = (sym: SymbolId, mult?: number) => SymbolVisual;

const overrides = new Map<SymbolId, SymbolVisualFactory>();
let fallback: SymbolVisualFactory | null = null;

/** Sustituye el visual de un símbolo (p. ej. por uno de Spine). */
export function registerSymbolVisual(sym: SymbolId, factory: SymbolVisualFactory) {
  overrides.set(sym, factory);
}

export function setDefaultSymbolVisual(factory: SymbolVisualFactory) {
  fallback = factory;
}

export function createSymbolVisual(sym: SymbolId, mult?: number): SymbolVisual {
  const f = overrides.get(sym) ?? fallback;
  if (!f) throw new Error('No hay visual por defecto registrado');
  return f(sym, mult);
}
