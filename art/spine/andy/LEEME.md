# Andy para Spine

Piezas recortadas de `art/source/spine/andy-pose-A.png` (pose en A) y montadas en `andy.json`.

## Cómo abrirlo en Spine
Spine → menú → **Import Data** → elige `andy.json` (deja la carpeta `images/` al lado).
Aparece el personaje montado, con los huesos ya puestos en las articulaciones. No trae animaciones.

## Piezas (`images/`)
- Cabeza: `head` (normal), `head_blink` (ojos cerrados) y `head_shout` (gritando), las tres en el mismo
  sitio. En el slot `head` se cambia de una a otra para parpadear o gritar.
- Torso, y de cada lado (L = izquierda de la imagen, R = derecha): `upperArm` (manga + brazo),
  `forearm`, `hand`, `thigh`, `shin` y `foot`.

## Huesos
root → hip → torso → neck (cabeza) / shoulder → elbow → wrist (brazos);
hip → thigh → knee → ankle (piernas).

## Solapes
Cada pieza de debajo se alarga un poco por debajo de la de encima y en codos, muñecas, rodillas, tobillos y
hombros hay un "tapón" redondo escondido, para que al doblar no se abran huecos.

## Límites
Subir y abrir los brazos, doblar codos, muñecas y rodillas y girar la cabeza va limpio (ver `prueba-poses.png`).
Bajar mucho los brazos pegándolos al cuerpo (más de ~25°) deja ver el hombro de la camiseta cuadrado:
para eso hay que deformar con malla en Spine o redibujar el hombro.
