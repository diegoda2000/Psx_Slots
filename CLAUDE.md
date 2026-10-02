# SlotPSX: contexto del proyecto

Responde siempre en español, con respuestas cortas y directas.

## Qué es
Dos slots de casino online (demo para navegador, sin dinero real) basadas en el canal de AndyPSX, streamer español de
slots que hace bonus hunts y sorteos para su comunidad. Son **dos slots separadas**, no una con selector de modo.

1. **Duelo** (`duelo/`, `src/games/duelo/`): inspirada en "Wanted Dead or a Wild" (Hacksaw). 3 o más iguales seguidos
   desde la izquierda (15.625 formas). Símbolos VS obligatorios: ocupan la columna, se pegan dos personajes y el ganador
   deja la columna como WILD con multiplicador de x2 a x100.
2. **Olimpo** (`olimpo/`, `src/games/olimpo/`): inspirada en "Gates of Olympus" (Pragmatic). Paga con 8 o más iguales en
   cualquier posición, con cascadas y orbes multiplicadores.

Bonus en las dos: 3 scatters = bonus, 4 = "semitocho", 5 = "tocho". En Duelo el tocho deja los VS fijos todo el bonus;
en Olimpo el multiplicador se acumula. Los tres se pueden comprar (bonus buy).

## Lore
- Frases míticas para ganancias grandes: "¡Apaga la puta radio!", "¡Iberru gordofóbico!", "¡Majaria es dictador!".
- Premium, de más a menos: Andy ("el sacarino"), Iberru, Elena, Macaco (hermano pequeño de Andy, "un mantenido del pelado").
- Bajos provisionales: botones de PlayStation. Los definitivos los decide el usuario.
- Gesto de Andy pidiendo "los bolos": el usuario ya tiene pensado cómo meterlo. **Preguntarle antes de inventarlo.**
- Investiga el lore por tu cuenta antes de preguntar cosas que se pueden buscar.

## Stack y arquitectura
- TypeScript + PixiJS 8 + Vite (multi-página: `index.html`, `duelo/index.html`, `olimpo/index.html`).
- Lógica de tiradas en el cliente, sin servidor.
- `src/shared/`: código común (RNG, símbolos, lore, tweens, tablero, overlay, cascarón del HUD en `game/shell.ts`).
- `src/games/<slot>/math.ts`: matemáticas puras, **sin importar PixiJS**, para que las use el simulador.
- `sim/rtp.ts`: simulador de RTP (`npm run sim`).
- Arte provisional hecho con código (`src/shared/view/CodeSymbolVisual.ts`). Spine más adelante: ver `docs/SPINE.md`.
  Toda animación nueva de símbolos debe pasar por la interfaz `SymbolVisual` para poder cambiarla por Spine.

## Comandos
- `npm run dev`, `npm run build`, `npm run typecheck`, `npm run sim -- --spins 3000000 --buys 30000 --game duelo`

## Estado
- Separadas en dos slots independientes a partir del boceto https://claude.ai/artifact/9HapWazZ7B3SLxPiaaE5yo
- Pendiente: fase de matemáticas. Objetivo inicial 93-95% de RTP; ver `docs/MATES.md` para la última simulación.
