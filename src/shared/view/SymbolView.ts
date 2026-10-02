import { Container } from 'pixi.js';
import type { SymbolId } from '../symbols';
import { createSymbolVisual, setDefaultSymbolVisual, type SymbolVisual } from './SymbolVisual';
import { CodeSymbolVisual } from './CodeSymbolVisual';

setDefaultSymbolVisual((sym, mult) => new CodeSymbolVisual(sym, mult));

/** Símbolo colocado en el tablero. La parte visual es intercambiable (código o Spine). */
export class SymbolView extends Container {
  readonly visual: SymbolVisual;

  constructor(readonly sym: SymbolId, readonly mult?: number) {
    super();
    this.visual = createSymbolVisual(sym, mult);
    this.addChild(this.visual.view);
  }

  playLand() {
    return this.visual.land();
  }
  playWin() {
    return this.visual.win();
  }
  playRemove() {
    return this.visual.remove();
  }
}
