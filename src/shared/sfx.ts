/**
 * Efectos de sonido de slot: giro de rodillos, golpe al parar, fichas de bonus, premios, monedas y fanfarrias.
 * Si la slot registra grabaciones (registerSounds), suena la grabación; si no, una versión sintetizada.
 * Respeta el interruptor "Efectos de sonido" del menú (settings.sfx).
 */
import { settings } from './settings';
import { speed } from './tween';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

/** El navegador solo deja sonar audio después de que el jugador toque algo. */
function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.45;
    // Compresor suave para que varios sonidos a la vez no saturen.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  void decodePending();
}

/** Grabaciones por nombre de sonido (varias variantes = se elige una al azar). */
const samples = new Map<string, AudioBuffer[]>();
let pending: [string, string][] = [];

/** Registra grabaciones: { nombre: [urls] }. Se decodifican al primer toque del jugador. */
export function registerSounds(files: Record<string, string[]>) {
  for (const [name, urls] of Object.entries(files)) for (const url of urls) pending.push([name, url]);
  void decodePending();
}

/** El visor de artifacts no deja hacer fetch() ni de data: URIs: el base64 se decodifica a mano. */
async function bytesOf(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:')) {
    const bin = atob(url.slice(url.indexOf(',') + 1));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  return (await fetch(url)).arrayBuffer();
}

async function decodePending() {
  if (!ctx || !pending.length) return;
  const todo = pending;
  pending = [];
  await Promise.all(
    todo.map(async ([name, url]) => {
      try {
        const buf = await ctx!.decodeAudioData(await bytesOf(url));
        samples.set(name, [...(samples.get(name) ?? []), buf]);
      } catch (e) {
        console.warn(`Sonido ${name} no válido`, e);
      }
    }),
  );
}

/** Toca una grabación si la hay. Devuelve false si no hay (y entonces se usa la sintetizada). */
function sample(name: string, { at = 0, vol = 1, rate = 1 } = {}) {
  const list = samples.get(name);
  if (!list?.length) return false;
  const a = ready();
  if (!a) return true; // hay grabación pero los efectos están apagados
  const src = a.createBufferSource();
  src.buffer = list[Math.floor(Math.random() * list.length)];
  src.playbackRate.value = rate;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(g).connect(master!);
  src.start(a.currentTime + at);
  return true;
}
for (const ev of ['pointerdown', 'keydown'] as const) window.addEventListener(ev, unlock, { capture: true });

function ready() {
  return settings.sfx && ctx && master && ctx.state === 'running' ? ctx : null;
}

/** Nota con envolvente rápida (ataque corto y caída exponencial). */
function tone(
  freq: number,
  { at = 0, dur = 0.25, type = 'sine' as OscillatorType, vol = 0.3, slide = 0, attack = 0.005 } = {},
) {
  const a = ready();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Ruido filtrado (giros, golpes, soplidos). */
function hiss({ at = 0, dur = 0.3, vol = 0.2, from = 800, to = 800, q = 1, type = 'bandpass' as BiquadFilterType } = {}) {
  const a = ready();
  if (!a) return;
  const t = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const NOTE = (n: number) => 440 * 2 ** ((n - 69) / 12);
/** Duración ajustada al turbo. */
const sp = (s: number) => s / speed.factor;

export const sfx = {
  /** Botón normal. */
  click() {
    if (sample('click', { vol: 0.7 })) return;
    tone(1800, { dur: 0.04, type: 'triangle', vol: 0.12 });
  },
  /** Subir o bajar la apuesta (más agudo cuanto más alta). */
  bet(level: number) {
    if (sample('bet', { rate: 0.85 + level * 0.4 })) return;
    tone(500 + level * 900, { dur: 0.06, type: 'triangle', vol: 0.15 });
  },
  /** Arranque del giro: soplido de rodillos que se van. */
  spin() {
    if (sample('spin')) return;
    hiss({ dur: sp(0.35), vol: 0.12, from: 2500, to: 500, q: 0.8 });
    tone(220, { dur: sp(0.12), type: 'triangle', vol: 0.08, slide: 0.6 });
  },
  /** Golpe seco de un rodillo al parar. */
  reelStop(col: number) {
    if (sample('reelStop', { rate: 1 - col * 0.02, vol: 0.6 })) return;
    tone(150 - col * 6, { dur: 0.12, vol: 0.35, slide: 0.5 });
    hiss({ dur: 0.05, vol: 0.12, from: 3000, to: 1500, q: 0.7, type: 'highpass' });
  },
  /** Cae una ficha FS: cada una más aguda que la anterior (tensión de bonus). */
  scatter(n: number) {
    if (sample('scatter', { rate: 2 ** ((Math.min(n, 4) - 1) / 4) })) return;
    const base = [76, 79, 83, 88][Math.min(n, 4) - 1] ?? 76;
    tone(NOTE(base), { dur: 0.5, type: 'triangle', vol: 0.25 });
    tone(NOTE(base + 12), { dur: 0.35, vol: 0.12, at: 0.02 });
    tone(NOTE(base + 19), { dur: 0.25, vol: 0.06, at: 0.04 });
  },
  /** Las fichas FS cuentan (bonus o tiradas extra). */
  scatterWin() {
    if (sample('scatterWin')) return;
    [72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), { at: i * 0.07, dur: 0.4, type: 'square', vol: 0.08 }));
  },
  /** +N tiradas gratis. */
  extraSpins() {
    if (sample('extraSpins')) return;
    [79, 84, 88, 91].forEach((n, i) => tone(NOTE(n), { at: i * 0.06, dur: 0.3, type: 'triangle', vol: 0.18 }));
  },
  /** Rodillo de la muerte activado: golpe grave. */
  death() {
    if (sample('death')) return;
    tone(65, { dur: 1.2, vol: 0.4, slide: 0.7 });
    tone(98, { dur: 0.9, type: 'sawtooth', vol: 0.06, slide: 0.6 });
    hiss({ dur: 0.8, vol: 0.1, from: 400, to: 120, q: 2 });
  },
  /** Wild que se despliega en todo su rodillo. */
  expand() {
    if (sample('expand')) return;
    hiss({ dur: sp(0.5), vol: 0.14, from: 300, to: 4000, q: 1.5 });
    tone(NOTE(55), { dur: sp(0.5), type: 'sawtooth', vol: 0.05, slide: 4 });
  },
  /** Aparece el multiplicador de un wild. */
  mult() {
    if (sample('mult')) return;
    tone(NOTE(84), { dur: 0.18, type: 'square', vol: 0.07 });
    tone(NOTE(91), { at: 0.06, dur: 0.25, type: 'triangle', vol: 0.16 });
  },
  /** Premio de línea: arpegio más largo cuanto más se gana (x = veces la apuesta). */
  win(x: number) {
    if (sample(x >= 5 ? 'winBig' : 'win') || sample('win')) return;
    const notes = x >= 5 ? [72, 76, 79, 84, 88] : x >= 1 ? [72, 76, 79, 84] : [76, 79, 84];
    notes.forEach((n, i) => tone(NOTE(n), { at: i * 0.06, dur: 0.35, type: 'triangle', vol: 0.18 }));
    this.coins(x >= 5 ? 14 : x >= 1 ? 8 : 4, 0.15);
  },
  /** Lluvia de monedas. */
  coins(count: number, at = 0, spread = 0.05) {
    for (let i = 0; i < count; i++) {
      const f = 2400 + Math.random() * 1800;
      const t = at + i * spread + Math.random() * spread * 0.6;
      tone(f, { at: t, dur: 0.09, type: 'square', vol: 0.035 });
      tone(f * 1.5, { at: t + 0.01, dur: 0.07, type: 'triangle', vol: 0.05 });
    }
  },
  /** Big win: monedas mientras sube el contador y fanfarria al final. */
  bigWin() {
    if (sample('bigWin')) return;
    const count = sp(2); // lo que tarda en subir el contador
    this.coins(Math.round(count / 0.06), 0.4, 0.06);
    const end = 0.4 + count;
    [60, 64, 67, 72].forEach((n, i) => tone(NOTE(n), { at: end + i * 0.09, dur: 0.5, type: 'square', vol: 0.07 }));
    [72, 76, 79, 84].forEach((n) => tone(NOTE(n), { at: end + 0.4, dur: 1.2, type: 'triangle', vol: 0.12 }));
  },
  /** Entrada al bonus. */
  bonusStart(top: boolean) {
    if (sample(top ? 'bonusStartTop' : 'bonusStart') || sample('bonusStart')) return;
    const seq = top ? [60, 63, 67, 72, 75, 79, 84] : [60, 64, 67, 72, 76, 79, 84];
    seq.forEach((n, i) => tone(NOTE(n), { at: i * 0.08, dur: 0.35, type: 'square', vol: 0.07 }));
    tone(NOTE(top ? 48 : 60), { at: 0.56, dur: 1.4, type: 'sawtooth', vol: 0.06 });
    [72, top ? 75 : 76, 79].forEach((n) => tone(NOTE(n), { at: 0.56, dur: 1.4, type: 'triangle', vol: 0.12 }));
  },
  /** Fin del bonus. */
  bonusEnd(x: number) {
    if (sample(x > 0 ? 'bonusEnd' : 'bonusEndZero') || (x > 0 && sample('win'))) return;
    if (x <= 0) {
      [67, 64, 60].forEach((n, i) => tone(NOTE(n), { at: i * 0.12, dur: 0.3, type: 'triangle', vol: 0.12 }));
      return;
    }
    [67, 72, 76, 79].forEach((n, i) => tone(NOTE(n), { at: i * 0.1, dur: 0.6, type: 'triangle', vol: 0.15 }));
    this.coins(12, 0.3);
  },
};
