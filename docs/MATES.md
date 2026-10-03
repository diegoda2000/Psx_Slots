# Matemáticas

Configuración en `src/games/duelo/math.ts` (`DUELO`) y `src/games/olimpo/math.ts` (`OLIMPO`).
Premio máximo 10.000x. Simulación: `npm run sim -- --game duelo --spins 10000000 --buys 200000 --seed 9360`.

## Duelo (estilo Life and Death)

### Reglas que fijan las matemáticas
- Tablero 6x5, 19 líneas de Life and Death, 3 o más iguales seguidos desde la izquierda.
- Tabla de pagos de Life and Death tal cual (premio por línea a 1 € = veces la apuesta):
  rata = 10, remos = J, OMG = K, radio = A, ternasco = corazón, símbolo 3 = sol, dormilón = mano, Andy the Hutt = caras.
- Wilds: Macaco x2-4 (rodillo 2), Majarias x5-9 (3), Iberru x10-25 (4), Andy x30-200 (5), multiplicadores de Life and
  Death. Como mucho uno de cada en pantalla. En su rodillo se despliegan siempre que así entren en premio (aunque haya
  una ficha FS en ese rodillo); en otro rodillo son un wild de una celda. Multiplicadores de una línea se suman.
- Fichas FS solo en los rodillos 2 a 5 (10,3% por rodillo, como mucho una por rodillo).
- Bonus: 3 fichas FS = BONUS (más wilds), 4 = TOCHO (rodillos de la muerte). 10 tiradas; dentro, 2 fichas +2 y
  3 o más +4. Compra: BONUS 100x, TOCHO 200x. Premio máximo 10.000x.
- El RTP se ajusta solo con la frecuencia de wilds por rodillo central: base 0,01677, BONUS 0,1368, TOCHO 0,1562.
- Pesos de símbolos (rata → Hutt) 34/32/32/30/22/20/17/14, elegidos para copiar la frecuencia de premio pública de
  Life and Death (27,93%).

### Datos públicos de Life and Death (Hacksaw)
- Frecuencia de premio 27,93% (con su RTP de 96,36%); versiones de RTP 96,36 / 94,26 / 92,33 / 88,24%.
- Volatilidad alta, premio máximo 15.000x, compras 100x y 200x, BonusHunt FeatureSpins (3x apuesta, 5x más bonus).
- No se publican la frecuencia de cada bonus ni su premio medio.
- Fuentes: slotcatalog.com, bigwinboard.com, aboutslots.com, olbg.com.

### Resultado — 10.000.000 tiradas y 200.000 compras de cada bonus (semilla 9360)

| | |
|---|---|
| **RTP total** | **93,5% ± 1,4%** (objetivo 93,6%): juego base 54,6% + bonus 38,9% |
| Frecuencia de premio | 28,3% (1 de cada 3,54 tiradas; Life and Death 27,93%) |
| Volatilidad | muy alta: desviación típica 22,4x por tirada; tope de 10.000x alcanzado 8 veces |
| BONUS | 1 de cada ~253 tiradas, media 93x |
| TOCHO | 1 de cada ~8.700 tiradas (hacen falta las 4 fichas), media 194x |

Reparto de premios por tirada (incluido el bonus que se abre en ella):

| 0x | <1x | 1-5x | 5-20x | 20-100x | 100-1.000x | 1.000x+ |
|---|---|---|---|---|---|---|
| 71,7% | 20,7% | 5,8% | 1,2% | 0,5% | 0,15% | 0,01% |

Compra de bonus (la media se cumple solo a muy largo plazo; cada bonus por separado es puro azar):

| | Precio | RTP | Mediana | 10% peores | 10% mejores | 1% mejores | Pierde dinero |
|---|---|---|---|---|---|---|---|
| BONUS | 100x | 93,6% ± 1,3% | 25x | < 2,1x | > 210x | > 1.016x | 78% de las veces |
| TOCHO | 200x | 94,4% ± 1,1% | 51x | < 3,8x | > 437x | > 2.093x | 79% de las veces |

El ± es el margen de error al 95% de la propia simulación: el RTP real de diseño es el mismo para los tres (≈93,6%).

## Olimpo — 3M tiradas, semilla 42 (valores del boceto)

| | |
|---|---|
| RTP total | 91,9% (base 63,2% + bonus 28,8%) |
| Bonus / semitocho / tocho | 1 cada ~202 / ~2.550 / ~36.600 |
| Compra bonus 55x / semi 100x / tocho 190x | 92,7% / 89,9% / 90,4% |

Pendiente en la fase de matemáticas: subir Olimpo al 93-95%, igualar el RTP de las compras y bajar la varianza de las
compras de Duelo.
