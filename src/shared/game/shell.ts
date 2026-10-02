import { Application, Container } from 'pixi.js';
import { BIG_WIN_PHRASES, BONUS_NAMES, MAX_WIN, bigWinLabel, type BonusTier } from '../lore';
import { money } from '../text';
import { speed, wait } from '../tween';
import { Overlay } from '../view/Overlay';
import type { BonusState, SlotGame } from './types';

export const BETS = [0.2, 0.5, 1, 2, 5, 10, 20];
export const PAD = 40;

const $ = (id: string) => document.getElementById(id)!;

/** Crea la aplicación PixiJS y la mete en #stage. */
export async function createStage(width: number, height: number) {
  try {
    await Promise.race([document.fonts.load('40px Bungee'), wait(2500)]);
  } catch {
    /* sin fuente: seguimos con la de respaldo */
  }
  const app = new Application();
  await app.init({
    width,
    height,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  $('stage').appendChild(app.canvas);
  const root = new Container();
  app.stage.addChild(root);
  return { app, root };
}

/**
 * Cascarón común de las dos slots: saldo, apuesta, turbo, compra de bonus,
 * flujo del bonus y big wins. La slot solo decide cómo se juega una tirada.
 */
export class SlotShell<B extends BonusState> {
  balance = 1000;
  betIdx = 2;
  busy = false;
  bonus: B | null = null;

  constructor(private game: SlotGame<B>, private overlay: Overlay) {
    this.bind();
    this.refresh();
  }

  get bet() {
    return BETS[this.betIdx];
  }

  private bind() {
    $('spin').onclick = () => this.spin();
    $('betDown').onclick = () => this.changeBet(-1);
    $('betUp').onclick = () => this.changeBet(1);
    $('turbo').onclick = () => {
      speed.factor = speed.factor === 1 ? 2.5 : 1;
      $('turbo').classList.toggle('on', speed.factor > 1);
    };
    document.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((b) => {
      b.onclick = () => this.buy(Number(b.dataset.tier) as BonusTier);
    });
    const rules = $('rules') as HTMLDialogElement;
    $('rulesBtn').onclick = () => {
      $('rulesBody').innerHTML = this.game.rulesHtml();
      rules.showModal();
    };
    $('rulesClose').onclick = () => rules.close();
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !rules.open) {
        e.preventDefault();
        this.spin();
      }
    });
  }

  private changeBet(d: number) {
    if (this.busy || this.bonus) return;
    this.betIdx = Math.max(0, Math.min(BETS.length - 1, this.betIdx + d));
    this.refresh();
  }

  refresh() {
    $('balance').textContent = money(this.balance);
    $('bet').textContent = money(this.bet);
    document.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((b) => {
      const price = this.game.buyPrice[Number(b.dataset.tier) as BonusTier] * this.bet;
      b.querySelector('span')!.textContent = money(price);
      b.disabled = this.busy || !!this.bonus || this.balance < price;
    });
    ($('spin') as HTMLButtonElement).disabled = this.busy;
    const info = $('fsInfo');
    const fs = this.bonus;
    info.hidden = !fs;
    if (fs) {
      const extra = this.game.bonusInfo?.(fs) ?? '';
      info.textContent = `${BONUS_NAMES[fs.tier]} · Tiradas: ${fs.left} · Ganado: ${money(fs.total * this.bet)}${extra}`;
    }
  }

  private showWin = (v: number) => {
    $('win').textContent = money(v);
  };

  private toast(msg: string) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  async spin() {
    if (this.busy || this.bonus) return;
    if (this.balance < this.bet) {
      this.toast('Sin saldo: recarga la página para empezar de nuevo');
      return;
    }
    this.busy = true;
    this.balance -= this.bet;
    this.showWin(0);
    this.refresh();
    const { win, tier } = await this.game.spin(null, { bet: this.bet, showWin: this.showWin });
    const x = Math.min(win, MAX_WIN);
    if (x > 0) {
      await this.celebrate(x);
      this.balance += x * this.bet;
      this.showWin(x * this.bet);
    }
    this.refresh();
    if (tier) await this.runBonus(tier);
    this.busy = false;
    this.refresh();
  }

  async buy(tier: BonusTier) {
    if (this.busy || this.bonus) return;
    const price = this.game.buyPrice[tier] * this.bet;
    if (this.balance < price) return;
    this.busy = true;
    this.balance -= price;
    this.showWin(0);
    this.refresh();
    await this.runBonus(tier);
    this.busy = false;
    this.refresh();
  }

  private async runBonus(tier: BonusTier) {
    const fs = this.game.createBonus(tier);
    this.bonus = fs;
    this.refresh();
    const w = this.overlay.w;
    const h = this.overlay.h;
    await this.overlay.banner(
      BONUS_NAMES[tier],
      `${fs.left} tiradas gratis\n${this.game.bonusPitch(tier)}`,
      tier === 3 ? 0xff3df2 : 0xffd23e,
    );
    while (fs.left > 0 && fs.total < MAX_WIN) {
      const before = fs.left;
      const { win } = await this.game.spin(fs, { bet: this.bet, showWin: this.showWin });
      this.showWin(fs.total * this.bet);
      const added = fs.left - (before - 1);
      if (added > 0) await this.overlay.floatText(`+${added} TIRADAS`, w / 2, h / 2, 0xffd23e, 48);
      await this.celebrate(win);
      this.refresh();
      await wait(250);
    }
    this.game.endBonus?.();
    const x = Math.min(fs.total, MAX_WIN);
    await this.overlay.banner('BONUS TERMINADO', `${money(x * this.bet)}  (${x.toFixed(1)}x)`, 0x4dff88, 3500);
    this.balance += x * this.bet;
    this.showWin(x * this.bet);
    this.bonus = null;
    this.refresh();
  }

  /** Big win con una frase mítica del canal. */
  private async celebrate(x: number) {
    const title = bigWinLabel(x);
    if (!title) return;
    const phrase = BIG_WIN_PHRASES[Math.floor(Math.random() * BIG_WIN_PHRASES.length)];
    await this.overlay.bigWin(title, Math.min(x, MAX_WIN) * this.bet, phrase, money);
  }
}
