/** Textos del lore del canal de AndyPSX. */
export const BIG_WIN_PHRASES = [
  '¡APAGA LA PUTA RADIO!',
  '¡IBERRU GORDOFÓBICO!',
  '¡MAJARIAS DICTADOR!',
  '¡EL SACARINO!',
];

export type BonusTier = 1 | 2 | 3;
export const BONUS_NAMES: Record<BonusTier, string> = { 1: 'BONUS', 2: 'SEMITOCHO', 3: 'TOCHO' };

/** Premio máximo, en veces la apuesta. */
export const MAX_WIN = 10_000;

/** 3 scatters → bonus, 4 → semitocho, 5+ → tocho. */
export function tierFromScatters(n: number): BonusTier | 0 {
  return n >= 5 ? 3 : n === 4 ? 2 : n === 3 ? 1 : 0;
}

export function bigWinLabel(x: number): string | null {
  if (x >= 100) return 'SACARINO WIN';
  if (x >= 50) return 'MEGA WIN';
  if (x >= 20) return 'BIG WIN';
  return null;
}
