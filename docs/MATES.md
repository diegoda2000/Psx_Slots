# Matemáticas

Configuración en `src/games/duelo/math.ts` (`DUELO`) y `src/games/olimpo/math.ts` (`OLIMPO`).
Premio máximo 10.000x. Simulación: `npm run sim -- --spins 4000000 --buys 40000 --seed 7`.

## Duelo (estilo Life and Death) — 4M tiradas y 60k compras, semilla 77

Tabla de pagos y 19 líneas copiadas de Life and Death (premio por línea a 1 € = veces la apuesta):
rata = 10, remos = J, OMG = K, radio = A, ternasco = corazón, símbolo 3 = sol, símbolo 2 = mano, Andy the Hutt = caras.
Multiplicadores de los wilds también los de Life and Death. El RTP se ajusta solo con la probabilidad de wild por rodillo
central: base 0,016, bonus 0,15, semitocho 0,171, tocho 0,076 (pesos de símbolos 24/24/22/22/12/10/8/6).

| | |
|---|---|
| RTP total | 94,7% (base 52,1% + bonus 42,6%) |
| Frecuencia de premio | 33,7% |
| Bonus / semitocho / tocho | 1 cada ~251 / ~4.900 / ~190.000 |
| Compra bonus 100x / semi 200x / tocho 500x | 94,6% / 94,9% / 95,2% |

La varianza es muy alta (topes de 10.000x): el RTP de las compras se mueve varios puntos entre simulaciones.

## Olimpo — 3M tiradas, semilla 42 (valores del boceto)

| | |
|---|---|
| RTP total | 91,9% (base 63,2% + bonus 28,8%) |
| Bonus / semitocho / tocho | 1 cada ~202 / ~2.550 / ~36.600 |
| Compra bonus 55x / semi 100x / tocho 190x | 92,7% / 89,9% / 90,4% |

Pendiente en la fase de matemáticas: subir Olimpo al 93-95%, igualar el RTP de las compras y bajar la varianza de las
compras de Duelo.
