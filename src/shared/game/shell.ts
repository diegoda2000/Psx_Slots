import { Application, Container } from 'pixi.js';
import { BIG_WIN_PHRASES, BONUS_NAMES, MAX_WIN, bigWinLabel, type BonusTier } from '../lore';
import { money, theme } from '../text';
import { speed, wait } from '../tween';
import { Overlay } from '../view/Overlay';
import type { BonusState, SlotGame } from './types';

/** Apuestas: 0,20-2 € de 20 en 20 céntimos, 3-10 € de euro en euro y 15-50 € de 5 en 5. */
export const BETS = [
  ...Array.from({ length: 10 }, (_, i) => +(0.2 * (i + 1)).toFixed(2)),
  ...Array.from({ length: 8 }, (_, i) => i + 3),
  ...Array.from({ length: 8 }, (_, i) => 15 + i * 5),
];
export const PAD = 40;

const $ = (id: string) => document.getElementById(id)!;
/** Elemento opcional: solo existe en las páginas que lo usan (p. ej. el panel de compra de Duelo). */
const $opt = (id: string) => document.getElementById(id);

/** Crea la aplicación PixiJS y la mete en #stage. */
export async function createStage(width: number, height: number, font = '40px Bungee') {
  try {
    await Promise.race([document.fonts.load(font), wait(2500)]);
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
  betIdx = 4; // 1,00 €
  busy = false;
  bonus: B | null = null;
  /** Autoplay activo (se para al pulsar girar, al entrar un bonus o sin saldo). */
  auto = false;
  /** Tiradas automáticas que quedan (Infinity = ilimitado). */
  autoLeft = 0;
  private autoRun = 0;
  private betPopTimer = 0;
  private buyTier: BonusTier | null = null;

  constructor(private game: SlotGame<B>, private overlay: Overlay) {
    this.bind();
    this.refresh();
  }

  private name(tier: BonusTier) {
    return this.game.bonusName?.(tier) ?? BONUS_NAMES[tier];
  }

  private price(tier: BonusTier) {
    return (this.game.buyPrice[tier] ?? 0) * this.bet;
  }

  get bet() {
    return BETS[this.betIdx];
  }

  private bind() {
    $('spin').onclick = () => (this.auto ? this.stopAuto() : this.spin());
    const auto = $opt('auto');
    const autoMenu = $opt('autoMenu') as HTMLDialogElement | null;
    if (auto)
      auto.onclick = () => {
        if (this.auto) this.stopAuto();
        else if (autoMenu) autoMenu.showModal();
        else this.startAuto(Infinity);
      };
    if (autoMenu) {
      autoMenu.querySelectorAll<HTMLButtonElement>('[data-auto]').forEach((b) => {
        b.onclick = () => {
          autoMenu.close();
          this.startAuto(b.dataset.auto === 'inf' ? Infinity : Number(b.dataset.auto));
        };
      });
      $('autoClose').onclick = () => autoMenu.close();
    }
    $('betDown').onclick = () => this.changeBet(-1);
    $('betUp').onclick = () => this.changeBet(1);
    // Selector de apuesta dentro del panel de compra (si existe).
    const buyBetDown = $opt('buyBetDown');
    const buyBetUp = $opt('buyBetUp');
    if (buyBetDown) buyBetDown.onclick = () => this.changeBet(-1);
    if (buyBetUp) buyBetUp.onclick = () => this.changeBet(1);
    $('turbo').onclick = () => {
      speed.factor = speed.factor === 1 ? 2.5 : 1;
      $('turbo').classList.toggle('on', speed.factor > 1);
    };
    const panel = $opt('buyPanel') as HTMLDialogElement | null;
    document.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((b) => {
      const tier = Number(b.dataset.tier) as BonusTier;
      b.onclick = () => (panel ? this.askBuy(tier) : this.buy(tier));
    });
    if (panel) {
      $('buyOpen').onclick = () => {
        this.buyTier = null;
        this.refresh();
        panel.showModal();
      };
      $('buyClose').onclick = () => panel.close();
      $('buyNo').onclick = () => {
        this.buyTier = null;
        this.refresh();
      };
      $('buyYes').onclick = () => {
        const t = this.buyTier;
        panel.close();
        this.buyTier = null;
        if (t) this.buy(t);
      };
    }
    const rules = $('rules') as HTMLDialogElement;
    $('rulesBtn').onclick = () => {
      $('rulesBody').innerHTML = this.game.rulesHtml(this.bet);
      rules.showModal();
    };
    $('rulesClose').onclick = () => rules.close();
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !document.querySelector('dialog[open]')) {
        e.preventDefault();
        this.spin();
      }
    });
  }

  /** Pide confirmación antes de comprar (panel estilo Hacksaw). */
  private askBuy(tier: BonusTier) {
    this.buyTier = tier;
    this.refresh();
    $opt('buyConfirm')?.scrollIntoView({ block: 'nearest' });
  }

  startAuto(count: number) {
    if (this.bonus || this.auto) return;
    this.auto = true;
    this.autoLeft = count;
    this.refresh();
    void this.autoLoop(++this.autoRun);
  }

  stopAuto() {
    this.auto = false;
    this.autoLeft = 0;
    this.refresh();
  }

  private async autoLoop(run: number) {
    while (this.auto && run === this.autoRun) {
      if (this.busy) {
        await wait(200);
        continue;
      }
      if (this.autoLeft <= 0) {
        this.stopAuto();
        break;
      }
      if (this.balance < this.bet) {
        this.toast('Sin saldo: autoplay detenido');
        this.stopAuto();
        break;
      }
      this.autoLeft--;
      await this.spin();
      await wait(250);
    }
  }

  private changeBet(d: number) {
    if (this.busy || this.bonus) return;
    this.betIdx = Math.max(0, Math.min(BETS.length - 1, this.betIdx + d));
    this.refresh();
    if (!document.querySelector('dialog[open]')) this.showBetPop();
  }

  /** Enseña la apuesta nueva en grande en medio de la pantalla un momento. */
  private showBetPop() {
    const pop = $opt('betPop');
    if (!pop) return;
    pop.querySelector('b')!.textContent = money(this.bet);
    pop.classList.remove('show');
    void pop.offsetWidth; // reinicia la animación si se pulsa seguido
    pop.classList.add('show');
    clearTimeout(this.betPopTimer);
    this.betPopTimer = window.setTimeout(() => pop.classList.remove('show'), 900);
  }

  refresh() {
    $('balance').textContent = money(this.balance);
    $('bet').textContent = money(this.bet);
    const buyBet = $opt('buyBet');
    if (buyBet) buyBet.textContent = money(this.bet);
    for (const [id, edge] of [['buyBetDown', 0], ['buyBetUp', BETS.length - 1]] as const) {
      const b = $opt(id) as HTMLButtonElement | null;
      if (b) b.disabled = this.busy || !!this.bonus || this.betIdx === edge;
    }
    document.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((b) => {
      const price = this.price(Number(b.dataset.tier) as BonusTier);
      (b.querySelector('.price') ?? b.querySelector('span'))!.textContent = money(price);
      b.disabled = this.busy || !!this.bonus || this.balance < price;
      b.classList.toggle('selected', Number(b.dataset.tier) === this.buyTier);
    });
    const spin = $('spin') as HTMLButtonElement;
    spin.disabled = this.busy && !this.auto;
    spin.classList.toggle('auto', this.auto);
    $opt('auto')?.classList.toggle('on', this.auto);
    const level = $opt('betLevel');
    if (level) level.style.width = `${((this.betIdx + 1) / BETS.length) * 100}%`;
    const count = $opt('autoCount');
    if (count) count.textContent = this.auto ? (this.autoLeft === Infinity ? '∞' : String(this.autoLeft)) : '';
    ($('betDown') as HTMLButtonElement).disabled = this.busy || !!this.bonus || this.betIdx === 0;
    ($('betUp') as HTMLButtonElement).disabled = this.busy || !!this.bonus || this.betIdx === BETS.length - 1;
    const buyOpen = $opt('buyOpen') as HTMLButtonElement | null;
    if (buyOpen) buyOpen.disabled = this.busy || !!this.bonus || this.auto;
    const confirm = $opt('buyConfirm');
    if (confirm) {
      confirm.hidden = !this.buyTier;
      if (this.buyTier) {
        const price = this.price(this.buyTier);
        $('buyConfirmText').textContent = `¿Comprar ${this.name(this.buyTier)} por ${money(price)}?`;
      }
    }
    const info = $('fsInfo');
    const fs = this.bonus;
    info.hidden = !fs;
    if (fs) {
      const extra = this.game.bonusInfo?.(fs) ?? '';
      info.textContent = `${this.name(fs.tier)} · Tiradas: ${fs.left} · Ganado: ${money(fs.total * this.bet)}${extra}`;
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
    const price = this.price(tier);
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
    if (this.auto) this.stopAuto();
    const fs = this.game.createBonus(tier);
    this.bonus = fs;
    this.refresh();
    const w = this.overlay.w;
    const h = this.overlay.h;
    await this.overlay.banner(
      this.name(tier),
      `${fs.left} tiradas gratis\n${this.game.bonusPitch(tier)}`,
      tier === (this.game.topTier ?? 3) ? theme.hot : theme.gold,
    );
    while (fs.left > 0 && fs.total < MAX_WIN) {
      const before = fs.left;
      const { win, retriggerShown } = await this.game.spin(fs, { bet: this.bet, showWin: this.showWin });
      this.showWin(fs.total * this.bet);
      const added = fs.left - (before - 1);
      if (added > 0 && !retriggerShown) await this.overlay.floatText(`+${added} TIRADAS`, w / 2, h / 2, theme.gold, 48);
      await this.celebrate(win);
      this.refresh();
      await wait(250);
    }
    this.game.endBonus?.();
    const x = Math.min(fs.total, MAX_WIN);
    await this.overlay.banner('BONUS TERMINADO', `${money(x * this.bet)}  (${x.toFixed(1)}x)`, theme.good, 3500);
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
