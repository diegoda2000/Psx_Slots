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
  /** La slot ya ha anunciado las tiradas extra de esta tirada (el cascarón no lo repite). */
  retriggerShown?: boolean;
}

/** Lo que cada slot aporta al cascarón común (HUD, saldo, compra de bonus, flujo del bonus). */
export interface SlotGame<B extends BonusState = BonusState> {
  /** Precio de compra de cada bonus que tenga la slot (veces la apuesta). */
  readonly buyPrice: Partial<Record<BonusTier, number>>;
  /** Nombre de cada bonus (por defecto BONUS / SEMITOCHO / TOCHO). */
  bonusName?(tier: BonusTier): string;
  /** Modo BonusHunt FeatureSpins (opcional): cada tirada cuesta `cost` veces la apuesta y el bonus sale más. */
  readonly hunt?: { cost: number };
  /** Premio máximo en veces la apuesta. Por defecto MAX_WIN (10.000x). */
  readonly maxWin?: number;
  /**
   * Niveles del botón turbo, en orden (el primero es la velocidad normal). Si no se da, el botón
   * alterna entre normal y x2,5.
   */
  readonly turboModes?: readonly { factor: number; label: string; cls?: string }[];
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
  /** Tirada del modo BonusHunt. */
  hunt?: boolean;
  showWin(amountMoney: number): void;
}
