# Matemáticas

Configuración en `src/games/duelo/math.ts` (`DUELO`) y `src/games/olimpo/math.ts` (`OLIMPO`).
Premio máximo 10.000x. Simulación: `npm run sim -- --spins 4000000 --buys 40000 --seed 7`.

## Duelo (estilo Life and Death) — 4M tiradas, semilla 7

Ajuste rápido de las probabilidades de wild (base 0,042; bonus 0,245; semitocho 0,252; tocho 0,1).

| | |
|---|---|
| RTP total | 95,1% (base 54,3% + bonus 40,8%) |
| Frecuencia de premio | 37% |
| Bonus / semitocho / tocho | 1 cada ~251 / ~5.400 / ~174.000 |
| Compra bonus 100x / semi 200x / tocho 500x | 90,5% / 95,1% / 97,1% |

La varianza es muy alta (topes de 10.000x): el RTP de las compras se mueve varios puntos entre simulaciones.

## Olimpo — 3M tiradas, semilla 42 (valores del boceto)

| | |
|---|---|
| RTP total | 91,9% (base 63,2% + bonus 28,8%) |
| Bonus / semitocho / tocho | 1 cada ~202 / ~2.550 / ~36.600 |
| Compra bonus 55x / semi 100x / tocho 190x | 92,7% / 89,9% / 90,4% |

Pendiente en la fase de matemáticas: subir Olimpo al 93-95%, igualar el RTP de las compras y bajar la varianza de las
compras de Duelo.
