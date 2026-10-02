# Cómo meter animaciones de Spine

Hoy los símbolos se dibujan con código. Todo el tablero habla con ellos a través de la interfaz
`SymbolVisual` (`src/shared/view/SymbolVisual.ts`), así que para pasar a Spine solo hay que escribir
otra implementación y registrarla. No hay que tocar las matemáticas ni el tablero.

## 1. Runtime
Para PixiJS 8 el runtime oficial es `@esotericsoftware/spine-pixi-v8` (el antiguo `pixi-spine` es para PixiJS 7 o anterior):

```bash
npm i @esotericsoftware/spine-pixi-v8
```

## 2. Convención de animaciones en cada esqueleto
| Animación | Cuándo | Método |
|-----------|--------|--------|
| `idle`    | en reposo (loop) | — |
| `land`    | al caer en el tablero | `land()` |
| `win`     | forma parte de un premio | `win()` |
| `remove`  | explota en una cascada (Olimpo) | `remove()` |

Exporta cada símbolo como `.skel` (o `.json`) + `.atlas` en `public/spine/`, con el id del símbolo como nombre
(`AND`, `IBE`, `ELE`, `MAC`, `WILD`, `BONUS`...).

## 3. Implementación de ejemplo

```ts
import { Assets } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { registerSymbolVisual, type SymbolVisual } from '../shared/view/SymbolVisual';

class SpineSymbolVisual implements SymbolVisual {
  readonly view: Spine;
  constructor(id: string) {
    this.view = Spine.from({ skeleton: `${id}-skel`, atlas: `${id}-atlas` });
    this.view.state.setAnimation(0, 'idle', true);
  }
  private play(name: string) {
    return new Promise<void>((resolve) => {
      const entry = this.view.state.setAnimation(0, name, false);
      entry.listener = { complete: () => resolve() };
      this.view.state.addAnimation(0, 'idle', true, 0);
    });
  }
  land() { return this.play('land'); }
  win() { return this.play('win'); }
  remove() { return this.play('remove'); }
  destroy() { this.view.destroy(); }
}

// Antes de crear el tablero:
Assets.add({ alias: 'AND-skel', src: 'spine/AND.skel' });
Assets.add({ alias: 'AND-atlas', src: 'spine/AND.atlas' });
await Assets.load(['AND-skel', 'AND-atlas']);
registerSymbolVisual('AND', () => new SpineSymbolVisual('AND'));
```

Los símbolos sin registrar siguen usando el arte de código, así que se puede ir símbolo a símbolo.

## Escenas grandes
La expansión de los rodillos wild (`DueloBoard.expand` en `src/games/duelo/view.ts`) y los big wins (`Overlay.bigWin`) son métodos
asíncronos aislados: se pueden reescribir para reproducir una animación de Spine sin cambiar quién los llama.
