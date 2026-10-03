/**
 * Ajustes del jugador (menú): velocidad del juego base y del bonus, música y efectos de sonido.
 * Se guardan en el navegador si se puede; si no, se usan los de por defecto.
 */
export interface PlayerSettings {
  /** Índice en `turboModes` de la slot: 0 normal, 1 turbo, 2 super turbo. */
  speedBase: number;
  speedBonus: number;
  /** Música de fondo. */
  music: boolean;
  /** Efectos de sonido. Sin música y sin efectos, la slot queda en silencio. */
  sfx: boolean;
}

const KEY = `slotpsx:${location.pathname}:ajustes`;

export const settings: PlayerSettings = { speedBase: 0, speedBonus: 0, music: true, sfx: true };

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) ?? '{}'));
} catch {
  /* sin almacenamiento: valores por defecto */
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* sin almacenamiento: solo dura esta partida */
  }
}
