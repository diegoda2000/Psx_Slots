# Matemáticas

Configuración en `src/games/duelo/math.ts` (`DUELO`) y `src/games/olimpo/math.ts` (`OLIMPO`).
Premio máximo 10.000x. Simulación: `npm run sim -- --spins 3000000 --buys 30000 --seed 42`.

## Última simulación (3M tiradas, semilla 42) — valores provisionales del boceto

| | Duelo | Olimpo |
|---|---|---|
| RTP total | 90,1% (base 55,1% + bonus 34,9%) | 91,9% (base 63,2% + bonus 28,8%) |
| Bonus (3 scatters) | 1 cada ~268 | 1 cada ~202 |
| Semitocho (4) | 1 cada ~5.300 | 1 cada ~2.550 |
| Tocho (5) | 1 cada ~330.000 | 1 cada ~36.600 |
| RTP compra bonus / semi / tocho | 82,9% / 94,9% / 93,5% | 92,7% / 89,9% / 90,4% |

El RTP está por debajo del objetivo (93-95%) y las compras no son uniformes: hay que afinarlo en la fase de matemáticas.
En Duelo la varianza es muy alta (topes de 10.000x), así que hacen falta muchos millones de tiradas para una cifra estable.
