# SlotPSX: contexto del proyecto

Responde siempre en español, con respuestas cortas y directas.

## Qué es
Dos slots de casino online (demo para navegador, sin dinero real) basadas en el canal de AndyPSX, streamer español de
slots que hace bonus hunts y sorteos para su comunidad. Son **dos slots separadas**, no una con selector de modo.

1. **Duelo** (`duelo/`, `src/games/duelo/`): copia la mecánica de "Life and Death" (Hacksaw). 19 líneas, 3 o más
   iguales seguidos desde la izquierda. Los 4 personajes son los 4 jinetes y **NO son símbolos de pago, solo wilds
   multiplicadores**: como mucho uno de cada en pantalla. Pueden caer en cualquier rodillo del 2 al 5; cada uno tiene su
   rodillo (Macaco 2, Majarias 3, Iberru 4, Andy 5; Majarias sustituye a Elena) y su rango (x2-4, x5-9, x10-25, x30-200). Si cae en su rodillo se
   expande a toda la columna (si así entra en premio); en otro rodillo es un wild normal con su multiplicador. Los
   multiplicadores de una línea se suman. Símbolos de pago (ilustraciones del usuario), de más a menos premio:
   1 Andy the Hutt, 2 Dormilón (DORMIDO, chico dormido con cascos; antes era Majarias dictador, que pasó a wild), 3 (por decidir, SIM3), 4 Ternasco, 5 Radio, 6 OMG Bro, 7 Remos,
   8 Rata. Altos = 1-4, bajos = 5-8. Scatter = ficha FS. Tabla de pagos, 19 líneas y multiplicadores copiados
   literalmente de Life and Death (ver `docs/MATES.md`); el RTP se ajusta con la frecuencia de wilds, no con la tabla.
   (Antes era estilo "Wanted" con duelos VS; el usuario lo cambió. Ser fiel a Life and Death.)
2. **Olimpo** (`olimpo/`, `src/games/olimpo/`): inspirada en "Gates of Olympus" (Pragmatic). Paga con 8 o más iguales en
   cualquier posición, con cascadas y orbes multiplicadores.

Bonus en las dos: 3 scatters = bonus, 4 = "semitocho", 5 = "tocho". Los tres se pueden comprar (bonus buy).
- Duelo: bonus = más wilds (Devastation); semitocho = rodillos de la muerte (Reckoning: el personaje que cae en su
  rodillo lo activa y desde entonces se expande en cualquier rodillo central); tocho = rodillos de la muerte y los
  rodillos expandidos se quedan fijos todo el bonus. Retrigger: 2 BONUS +2, 3 BONUS +4.
- Olimpo: el multiplicador se va acumulando.

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
  nivel, botón de girar grande), turbo, autoplay (menú 10/25/50/100/250/500/1000/ilimitado, contador en el botón) y compra de
  bonus en panel con confirmación y selector de apuesta. Apuestas: 0,20-2 € de 20 en 20 céntimos, 3-10 € de euro en euro
  y 15-50 € de 5 en 5; al cambiarla sale en grande en el
  centro. Olimpo mantiene la interfaz vieja.
- Wild de personaje en Duelo: en la celda solo el retrato, sin multiplicador. Al desplegarse, el cuerpo completo va
  apareciendo según se abre la columna y el multiplicador sale al terminar. Si no se despliega, el multiplicador sale
  cuando entra en una línea premiada.
  Toda animación nueva de símbolos debe pasar por la interfaz `SymbolVisual` para poder cambiarla por Spine.

## Comandos
- `npm run dev`, `npm run build`, `npm run typecheck`, `npm run sim -- --spins 3000000 --buys 30000 --game duelo`
- `npm run build:demo`: cada slot en un HTML autocontenido (`dist-demo/`). Demos publicadas: Duelo https://claude.ai/artifact/1RB24hTi9n3Hvzhj4MWQKz · Olimpo https://claude.ai/artifact/To7kizU4n5rYppzZpBbBmK

## Estado
- Separadas en dos slots independientes a partir del boceto https://claude.ai/artifact/9HapWazZ7B3SLxPiaaE5yo
- Pendiente: fase de matemáticas. Objetivo inicial 93-95% de RTP; ver `docs/MATES.md` para la última simulación.
