# Andy para Spine (v3, sacado de la hoja de personaje)

Abrir: Spine → **Import Data** → `andy.json` (con la carpeta `images/` al lado). Spine 4.2. Validado con la librería
oficial `@esotericsoftware/spine-core` 4.2, vista por vista. Sustituye al rig v2 (era otro dibujo de Andy; sigue en
el historial de git). La hoja original está en `art/source/spine/andy-hoja-personaje.webp`.

## Vistas
Seis vistas: `frente`, `34der`, `perfilDer`, `espalda`, `34izq` y `perfilIzq` (`vistas.png`). Las de la izquierda son
el espejo de las de la derecha, salvo las cabezas, que son las que dibuja la hoja para ese lado.

Cada vista es una animación `vista_<nombre>` de un solo fotograma. Pone el adjunto de esa vista en cada slot, coloca
y gira los huesos como en esa vista y cambia el orden de dibujo (en perfil el brazo de atrás va detrás del cuerpo).
La pose de montaje es `frente`.

Para que Andy se gire dentro de una animación tuya, copia las claves de `vista_X` (adjuntos, huesos y orden de
dibujo) en el fotograma del cambio. Pon esas claves de huesos en **Stepped**, para que no se deslicen entre una vista
y otra. El cambio de vista es instantáneo, como en cualquier 2D. Se disimula con un pequeño salto o un parpadeo en
ese fotograma.

## Huesos
`root`, `hip`, `torso`, `neck`, `head` y, por lado, `shoulder`, `elbow`, `wrist`, `thigh`, `shin` y `foot`. En
todas las vistas cada hueso apunta a lo largo de su miembro, así que girar hombro, codo, muñeca, cadera, rodilla o
tobillo funciona igual en cualquier vista.

**L es el lado derecho de Andy**: a la izquierda de la imagen cuando mira de frente y a la derecha cuando está de
espaldas. Así un hueso es siempre la misma mano o la misma pierna en todas las vistas.

## Slots y adjuntos
18 slots: `sleeveL/R` (manga, en el hueso del hombro, encima del brazo), `pelvis`, `thighL/R`, `shinL/R`, `footL/R`, `neck`, `torso`, `upperArmL/R` (brazo con la manga),
`forearmL/R`, `handL/R` y `head`. Los adjuntos se llaman `<slot>_<vista>`, por ejemplo `torso_perfilDer`.

- **Cabezas** (slot `head`): `cabeza_<vista>_<expresión>`, con las expresiones `normal`, `ojosCerrados`, `boca`,
  `dientes`, `enfado` y `sorpresa`, más `cabeza_espalda`. Para parpadear, pon `ojosCerrados` dos o tres fotogramas.
- **Manos de la hoja** (slots `handL` y `handR`, valen en todas las vistas): `palma`, `dorso`, `palmaArriba`,
  `palmaArriba34`, `palmaArribaLado`, `canto`, `puno`, `punoLado`, `senala`, `senalaLado`, `pulgar` y `pulgar34`.
  Cada una tiene además su versión `_espejo` (la misma mano volteada). El nombre completo es
  `mano_<tipo>[_espejo]_<L|R>`. Siguen al hueso de la muñeca con los dedos en la dirección del antebrazo: para
  orientarlas, gira la muñeca. La mano por defecto de cada vista es la del dibujo del cuerpo (`handL_<vista>`).

## Notas
- Todo sale de la hoja, que mide 1055×1491 px para unos 100 dibujos. Lo amplié x4 con un ampliador para dibujos
  (Real-ESRGAN anime). Queda nítido, pero no es un dibujo hecho a esa resolución.
- En perfil, el brazo de atrás no se ve en la hoja. Es una copia del de delante, algo más oscura y detrás del cuerpo.
- Lo que tapan las manos, las mangas, la cabeza y las articulaciones está pintado (tela negra con su contorno, piel
  en el cuello) para que no salgan huecos al moverse. Con giros muy grandes puede notarse algún borde.
- Las cabezas de la hoja no traen ojos, cejas ni boca por separado: cada expresión es una cabeza entera.
- No se usan los 9 brazos sueltos de la hoja (esas posturas ya salen doblando los huesos) ni la segunda fila de
  manos (repite la primera).
- `prueba-poses.png`: poses de prueba con el runtime de Spine. `prueba-articulaciones.png`: hombros, codos, caderas y rodillas con giros fuertes en las 6 vistas. Brazos y piernas son mallas con pesos: se doblan en las articulaciones sin partirse.
