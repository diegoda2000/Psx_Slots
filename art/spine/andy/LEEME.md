# Andy para Spine (v2)

Abrir: Spine → **Import Data** → `andy.json` (con la carpeta `images/` al lado). Sale montado, con 27 huesos y
32 slots, sin animaciones. Validado con la librería oficial `@esotericsoftware/spine-core` 4.2.

## Piezas
- Cabeza: `head`, `headBack`, orejas (`earL/R`), gorra (`cap`), cejas (`browL/R`), ojos (`eyeL/R`, con la variante
  `eyeL_closed`/`eyeR_closed` en el mismo slot), iris (`irisL/R`, con recorte para que no se salgan del ojo al
  moverlos), boca (`mouth`, con la variante `mouth_shout`), cuello (`neck`) y cuello de la camiseta (`collar`).
  Para cerrar los ojos: cambia el ojo a `_closed` y oculta el iris.
- Camiseta: `torso`, `torsoBack` (interior del cuello) y mangas (`sleeveL/R`, en los huesos de los hombros).
- Brazos: `upperArmL/R`, `forearmL/R`, `handL/R`.
- Piernas: `thighL/R`, `shinL/R`, `footL/R`.

Las zonas tapadas (cráneo bajo la gorra, piel bajo cejas y boca, blanco del ojo bajo el iris, hombros bajo las
mangas, interior del cuello, partes ocultas de brazos y piernas) están pintadas para que al moverse no salgan huecos.
En reposo, el montaje es idéntico al dibujo original. L = izquierda de la imagen.
