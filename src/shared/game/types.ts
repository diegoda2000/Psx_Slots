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
  /** Precio de compra de cada bonus que tenga la slot (veces la apuesta). */
  readonly buyPrice: Partial<Record<BonusTier, number>>;
  /** Nombre de cada bonus (por defecto BONUS / SEMITOCHO / TOCHO). */
  bonusName?(tier: BonusTier): string;
  /** El bonus más gordo de la slot (se anuncia con el color fuerte). Por defecto 3. */
  readonly topTier?: BonusTier;
  /** Subtítulo del banner de inicio de cada bonus. */
  bonusPitch(tier: BonusTier): string;
  /** HTML de la ventana de reglas; recibe la apuesta actual para enseñar premios en euros. */
  rulesHtml(bet: number): string;
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
