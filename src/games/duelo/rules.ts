import { BONUS_NAMES, MAX_WIN, type BonusTier } from '../../shared/lore';
import { PAY_SYMBOLS, SYMBOLS } from '../../shared/symbols';
import { DUELO } from './math';

const x = (v: number) => `${+v.toFixed(4)}x`;

export const PITCH: Record<BonusTier, string> = {
  1: 'Más duelos VS',
  2: 'Duelos VS desde x5',
  3: 'Los VS se quedan FIJOS todo el bonus',
};

export function rulesHtml() {
  const rows = [...PAY_SYMBOLS].reverse();
  const tiers: BonusTier[] = [1, 2, 3];
  const what: Record<BonusTier, string> = {
    1: `${DUELO.tiers[1].spins} tiradas, más VS`,
    2: `${DUELO.tiers[2].spins} tiradas, VS desde x5`,
    3: `${DUELO.tiers[3].spins} tiradas, los VS se quedan fijos`,
  };
  return `
  <h3>DUELO</h3>
  <p>Tablero 6x5 con <b>15.625 formas de ganar</b>: 3 o más símbolos iguales en columnas seguidas, empezando por la izquierda.
  El <b>WILD</b> sale en las columnas 2 a 5 y sustituye a todo menos al BONUS.</p>
  <p><b>VS</b>: puede caer en las columnas 2 a 5. Ocupa la columna entera, dos personajes se pegan y el ganador la convierte en
  <b>WILD con multiplicador</b> (x2 a x100). Si hay varios VS en un premio, sus multiplicadores se suman.</p>
  <table><tr><th>Símbolo</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
  ${rows.map((s) => `<tr><td>${SYMBOLS[s].name}</td>${DUELO.pays[s].map((p) => `<td>${x(p)}</td>`).join('')}</tr>`).join('')}
  </table><p class="small">Pago por cada forma, en veces la apuesta.</p>
  <h3>Bonus</h3>
  <p>Un BONUS como mucho por columna. 3 BONUS abren el bonus, 4 el semitocho y 5 o más el tocho.
  Con 3 BONUS dentro del bonus: +${DUELO.retrigger} tiradas.</p>
  <table><tr><th>Bonus</th><th>Qué tiene</th><th>Compra</th></tr>
  ${tiers.map((t) => `<tr><td>${BONUS_NAMES[t]} (${t + 2})</td><td>${what[t]}</td><td>${DUELO.buyPrice[t]}x</td></tr>`).join('')}
  </table>
  <p class="small">Premio máximo: ${MAX_WIN.toLocaleString('es-ES')}x la apuesta. Números provisionales, se afinan en la fase de matemáticas.</p>`;
}
