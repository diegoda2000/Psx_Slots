# SlotPSX: contexto del proyecto

Responde siempre en español, con respuestas cortas y directas.

## Qué es
Dos slots de casino online (demo para navegador, sin dinero real) basadas en el canal de AndyPSX, streamer español de
slots que hace bonus hunts y sorteos para su comunidad. Son **dos slots separadas**, no una con selector de modo.

1. **Duelo** (`duelo/`, `src/games/duelo/`): copia la mecánica de "Life and Death" (Hacksaw). 19 líneas, 3 o más
   iguales seguidos desde la izquierda. Los 4 personajes son los 4 jinetes y **NO son símbolos de pago, solo wilds
   multiplicadores**: como mucho uno de cada en pantalla. Pueden caer en cualquier rodillo del 2 al 5; cada uno tiene su
   rodillo (Macaco 2, Majarias 3, Iberru 4, Andy 5; Majarias sustituye a Elena) y su rango (x2-4, x5-9, x10-25, x30-200).
   Cuanto mejor, más raro: pesos de aparición Macaco 8, Majarias 4, Iberru 2, Andy 1 (`charWeights`). Si cae en su rodillo se
   expande a toda la columna (si así entra en premio); en otro rodillo es un wild normal con su multiplicador. Los
   multiplicadores de una línea se suman. Símbolos de pago (ilustraciones del usuario), de más a menos premio:
   1 Andy the Hutt, 2 Dormilón (DORMIDO, chico dormido con cascos; antes era Majarias dictador, que pasó a wild), 3 (por decidir, SIM3), 4 Ternasco, 5 Radio, 6 OMG Bro, 7 Remos,
   8 Rata. Altos = 1-4, bajos = 5-8. Scatter = ficha FS. Tabla de pagos, 19 líneas y multiplicadores copiados
   literalmente de Life and Death (ver `docs/MATES.md`); premio máximo 15.000x (Olimpo sigue en 10.000x); el RTP se ajusta con la frecuencia de wilds, no con la tabla.
   (Antes era estilo "Wanted" con duelos VS; el usuario lo cambió. Ser fiel a Life and Death.)
2. **Olimpo** (`olimpo/`, `src/games/olimpo/`): inspirada en "Gates of Olympus" (Pragmatic). Paga con 8 o más iguales en
   cualquier posición, con cascadas y orbes multiplicadores.

Bonus (se pueden comprar):
- Duelo: solo dos. Fichas FS solo en los rodillos 2-5. 3 fichas FS = BONUS (más wilds, como Devastation, compra 100x); 4 fichas = TOCHO (rodillos de la
  muerte, como Reckoning: el personaje que cae en su rodillo lo activa y desde entonces se expande en cualquier rodillo
  central; compra 200x). Modo BonusHunt como Hacksaw (en el panel de compra): tiradas a 3x, bonus ~5 veces más, mismo RTP. El tocho antiguo (wilds fijos) se eliminó y el semitocho pasó a llamarse TOCHO. Sin premio
  mínimo. Retrigger: 2 fichas +2, 3 o más +4.
- Olimpo: 3 scatters = bonus, 4 = "semitocho", 5 = "tocho"; el multiplicador se va acumulando. **No tocar Olimpo
  salvo que el usuario lo pida.**
- Regla de despliegue en Duelo: si un personaje cae en su rodillo y así entra en premio, se despliega SIEMPRE (también
  con una ficha FS en ese rodillo). Si hay fichas FS que cuentan (bonus o tiradas extra), primero se enseñan y se
  anuncian las tiradas extra; después se despliega y el rodillo tapa la ficha. Test de ~13.000 casos sin fallos.

## Lore
- Frases míticas para ganancias grandes: "¡Apaga la puta radio!", "¡Iberru gordofóbico!", "¡Majarias dictador!" (es MAJARIAS, con S, y sin "es").
- Personajes, de más a menos: Andy ("el sacarino"), Iberru, Elena, Macaco (hermano pequeño de Andy, "un mantenido del
  pelado"). En Olimpo son los símbolos premium. En Duelo los wilds son Andy, Iberru, Majarias (con uniforme de
  dictador) y Macaco: Elena no sale en Duelo.
- Olimpo aún usa botones de PlayStation como bajos provisionales.
- Gesto de Andy pidiendo "los bolos": el usuario ya tiene pensado cómo meterlo. **Preguntarle antes de inventarlo.**
- Investiga el lore por tu cuenta antes de preguntar cosas que se pueden buscar.

## Stack y arquitectura
- TypeScript + PixiJS 8 + Vite (multi-página: `index.html`, `duelo/index.html`, `olimpo/index.html`).
- Lógica de tiradas en el cliente, sin servidor.
- `src/shared/`: código común (RNG, símbolos, lore, tweens, tablero, overlay, cascarón del HUD en `game/shell.ts`).
- `src/games/<slot>/math.ts`: matemáticas puras, **sin importar PixiJS**, para que las use el simulador.
- `sim/rtp.ts`: simulador de RTP (`npm run sim`).
- Arte provisional hecho con código (`src/shared/view/CodeSymbolVisual.ts`). Spine más adelante: ver `docs/SPINE.md`.
- Ilustraciones (del usuario): originales en `art/source/`. Versión de juego: personajes en
  `src/games/duelo/art/<ID>.webp` + retrato `<ID>-face.webp`; símbolos en `src/games/duelo/art/symbols/<ID>.webp`
  (BONUS = ficha FS). Se cargan solos por nombre de archivo (`art.ts`); lo que falte usa arte de código.
  Iberru = pelo rizado, Macaco = mono calvo, Andy = gorra AAA, Majarias = uniforme de dictador. El símbolo 3 aún no tiene
  ilustración.
- El chat solo deja ~5 imágenes por mensaje y las que llegan mientras trabajo no se guardan como archivo:
  pedir que las reenvíe en un mensaje nuevo.
- Estética de Duelo sacada de los símbolos (`src/games/duelo/palette.ts` y `style.css`): tinta negra, pegatina blanco
  hueso, amarillo "OMG BRO", rojo; fuentes Luckiest Guy y Barlow Condensed. Interfaz estilo Hacksaw: barra inferior,
  misma disposición que la barra de Hacksaw (compra de bonus redonda a la izquierda, saldo, apuesta con flechas y barra de
  nivel, botón de girar grande), menú en las tres rayas (INFO = reglas; velocidad normal/turbo x1,6/super turbo x2,5 por separado para juego base
  y bonus; interruptores de música y de efectos, guardados en `src/shared/settings.ts`). Efectos de sonido grabados en
  `src/games/duelo/sounds/<nombre>.mp3` (CC0 de Freesound, Kenney y la TR-808, elegidos por el usuario de oído; ver CREDITOS.md; se cargan solos por nombre). Solo lo básico, estilo
  Hacksaw: giro, parada, ficha FS, premio, botones (B) y apuesta (C); el resto en silencio y nunca sintetizado;
  el usuario odia los sintetizados (`src/shared/sfx.ts`, solo de reserva) y los de casino recargados (alarmas, campanas,
  monedas); la música aún no existe, a la derecha solo
  el botón de autoplay, autoplay (menú 10/25/50/100/250/500/1000/ilimitado, contador en el botón) y compra de
  bonus en panel con confirmación y selector de apuesta. Apuestas: 0,20-2 € de 20 en 20 céntimos, 3-10 € de euro en euro
  y 15-50 € de 5 en 5; al cambiarla sale en grande en el
  centro. Olimpo mantiene la interfaz vieja.
- Wild de personaje en Duelo: en la celda, retrato en un cuadrado de esquinas redondeadas, sin la palabra WILD. Si no se
  despliega, el multiplicador sale abajo (donde no tapa la cara) al entrar en una línea premiada. Al desplegarse, el
  cuerpo completo va apareciendo según se abre la columna y el multiplicador sale arriba al terminar; abajo no va
  nada (ni WILD ni nombre: el nombre ya está encima del rodillo). Rodillos de Duelo de 118 px de ancho; los cuerpos están centrados en sus imágenes.
  Toda animación nueva de símbolos debe pasar por la interfaz `SymbolVisual` para poder cambiarla por Spine.

## Comandos
- `npm run dev`, `npm run build`, `npm run typecheck`, `npm run sim -- --spins 3000000 --buys 30000 --game duelo`
- `npm run build:demo`: cada slot en un HTML autocontenido (`dist-demo/`). Demos publicadas: Duelo https://claude.ai/artifact/1RB24hTi9n3Hvzhj4MWQKz · Olimpo https://claude.ai/artifact/To7kizU4n5rYppzZpBbBmK

## Estado
- Separadas en dos slots independientes a partir del boceto https://claude.ai/artifact/9HapWazZ7B3SLxPiaaE5yo
- Matemáticas de Duelo: RTP objetivo **93,6%**, muy volátil, frecuencia de premio ~28% copiada de Life and Death
  (27,93% pública); ver `docs/MATES.md` (simulación de 10M tiradas).
  El RTP se cumple a largo plazo (millones de tiradas), no por bonus: no prometer resultados por bonus.
