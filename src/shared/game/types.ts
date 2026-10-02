import type { BonusTier } from '../lore';

/** Estado común de una ronda de tiradas gratis. */
export interface BonusState {
  tier: BonusTier;
  left: number;
  played: number;
  /** Ganado en el bonus, en veces la apuesta. */
  total: number;
}

export interface SpinOutcome {
  /** Premio de la tirada, en veces la apuesta. */
  win: number;
  /** Bonus que abre esta tirada (solo en juego base). */
  tier: BonusTier | 0;
}

/** Lo que cada slot aporta al cascarón común (HUD, saldo, compra de bonus, flujo del bonus). */
export interface SlotGame<B extends BonusState = BonusState> {
  readonly buyPrice: Record<BonusTier, number>;
  /** Subtítulo del banner de inicio de cada bonus. */
  bonusPitch(tier: BonusTier): string;
  rulesHtml(): string;
  createBonus(tier: BonusTier): B;
  /** Texto extra en la barra del bonus (p. ej. el multiplicador acumulado). */
  bonusInfo?(bonus: B): string;
  /** Juega y anima una tirada; con bonus = tirada gratis. */
  spin(bonus: B | null, ctx: SpinContext): Promise<SpinOutcome>;
  /** Limpia lo que quede en el tablero al acabar el bonus. */
  endBonus?(): void;
}

export interface SpinContext {
  bet: number;
  showWin(amountMoney: number): void;
}
