import { BONUS_NAMES, MAX_WIN, type BonusTier } from '../../shared/lore';
import { PREMIUMS, SYMBOLS } from '../../shared/symbols';
import { CHAR_REEL, DUELO, DUELO_PAYS, LINES } from './math';

const x = (v: number) => `${+(v * DUELO.payScale).toFixed(4)}x`;

export const PITCH: Record<BonusTier, string> = {
  1: 'Más wilds de personaje',
  2: 'Rodillos de la muerte: cada personaje que cae en su rodillo se expande en todos',
  3: 'Rodillos de la muerte y los wilds expandidos se quedan FIJOS',
};

export function rulesHtml() {
  const rows = [...DUELO_PAYS].reverse();
  const tiers: BonusTier[] = [1, 2, 3];
  const what: Record<BonusTier, string> = {
    1: `${DUELO.tiers[1].spins} tiradas, más wilds`,
    2: `${DUELO.tiers[2].spins} tiradas, rodillos de la muerte`,
    3: `${DUELO.tiers[3].spins} tiradas, rodillos de la muerte y wilds fijos`,
  };
  const chars = [...PREMIUMS].sort((a, b) => CHAR_REEL[a] - CHAR_REEL[b]);
  return `
  <h3>DUELO</h3>
  <p>Tablero 6x5 con <b>${LINES.length} líneas</b>: 3 o más iguales seguidos desde la izquierda.</p>
  <p><b>Andy, Iberru, Elena y Macaco no pagan como símbolos: son los wilds multiplicadores.</b> Como mucho sale uno
  de cada en pantalla y pueden caer en cualquier rodillo del 2 al 5. Cada uno tiene su rodillo: si cae en él se
  <b>expande</b> a toda la columna (siempre que así entre en algún premio). En otro rodillo hace de wild normal con su
  multiplicador. Si una línea pasa por varios wilds, sus multiplicadores se suman.</p>
  <table><tr><th>Personaje</th><th>Rodillo</th><th>Multiplicador</th></tr>
  ${chars
    .map((c) => {
      const m = DUELO.wildMults[c].map(([v]) => v);
      return `<tr><td>${SYMBOLS[c].name}</td><td>${CHAR_REEL[c] + 1}</td><td>x${m[0]} a x${m[m.length - 1]}</td></tr>`;
    })
    .join('')}
  </table>
  <table><tr><th>Símbolo</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
  ${rows.map((s) => `<tr><td>${SYMBOLS[s].name}</td>${DUELO.pays[s].map((p) => `<td>${x(p)}</td>`).join('')}</tr>`).join('')}
  </table><p class="small">Pago por línea, en veces la apuesta total.</p>
  <h3>Bonus</h3>
  <p>Un BONUS como mucho por rodillo. 3 BONUS abren el bonus, 4 el semitocho y 5 o más el tocho.
  Dentro del bonus: 2 BONUS dan +${DUELO.retrigger[2]} tiradas y 3 o más, +${DUELO.retrigger[3]}.</p>
  <p><b>Rodillos de la muerte</b> (semitocho y tocho): cuando un personaje cae en su propio rodillo, lo activa.
  Desde entonces su wild se expande caiga en el rodillo central que caiga.</p>
  <table><tr><th>Bonus</th><th>Qué tiene</th><th>Compra</th></tr>
  ${tiers.map((t) => `<tr><td>${BONUS_NAMES[t]} (${t + 2})</td><td>${what[t]}</td><td>${DUELO.buyPrice[t]}x</td></tr>`).join('')}
  </table>
  <p class="small">Premio máximo: ${MAX_WIN.toLocaleString('es-ES')}x la apuesta. Números provisionales, se afinan en la fase de matemáticas.</p>`;
}
