import { registerSounds } from '../../shared/sfx';

/**
 * Grabaciones de Duelo: basta con dejar el archivo en sounds/ con el nombre del sonido (variantes: nombre-2.mp3...).
 * Nombres: click, bet, spin, reelStop, scatter, scatterWin, extraSpins, death, expand, mult, win, winBig, bigWin,
 * bonusStart, bonusStartTop, bonusEnd, bonusEndZero. Lo que no tenga grabación suena sintetizado.
 */
const FILES = import.meta.glob('./sounds/*.{mp3,ogg,wav,m4a}', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>;

export function loadDueloSounds() {
  const byName: Record<string, string[]> = {};
  for (const [path, url] of Object.entries(FILES)) {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '').replace(/-\d+$/, '');
    (byName[name] ??= []).push(url);
  }
  registerSounds(byName);
}
