# Matemáticas

Configuración en `src/games/duelo/math.ts` (`DUELO`) y `src/games/olimpo/math.ts` (`OLIMPO`).
Premio máximo 10.000x. Simulación: `npm run sim -- --spins 4000000 --buys 40000 --seed 7`.

## Duelo (estilo Life and Death) — 4M tiradas y 60k compras, semilla 11

Personajes solo como wilds (uno de cada como máximo). Escala de pagos 0,52; probabilidad de wild por rodillo central:
base 0,042, bonus 0,235, semitocho 0,246, tocho 0,1.

| | |
|---|---|
| RTP total | 92,8% (base 50,5% + bonus 42,3%) |
| Frecuencia de premio | 37% |
| Bonus / semitocho / tocho | 1 cada ~253 / ~5.100 / ~200.000 |
| Compra bonus 100x / semi 200x / tocho 500x | 94,6% / 93,1% / 96,5% |

La varianza es muy alta (topes de 10.000x): el RTP de las compras se mueve varios puntos entre simulaciones.

## Olimpo — 3M tiradas, semilla 42 (valores del boceto)

| | |
|---|---|
| RTP total | 91,9% (base 63,2% + bonus 28,8%) |
| Bonus / semitocho / tocho | 1 cada ~202 / ~2.550 / ~36.600 |
| Compra bonus 55x / semi 100x / tocho 190x | 92,7% / 89,9% / 90,4% |

Pendiente en la fase de matemáticas: subir Olimpo al 93-95%, igualar el RTP de las compras y bajar la varianza de las
compras de Duelo.
