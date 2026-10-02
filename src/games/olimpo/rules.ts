import { BONUS_NAMES, MAX_WIN, type BonusTier } from '../../shared/lore';
import { SYMBOLS } from '../../shared/symbols';
import { OLIMPO, OLIMPO_PAYS } from './math';

const x = (v: number) => `${+v.toFixed(4)}x`;

export const PITCH: Record<BonusTier, string> = {
  1: 'El multiplicador se acumula',
  2: 'Más orbes y se acumulan',
  3: 'Orbes desde x5 y se acumulan',
};

export function rulesHtml() {
  const rows = [...OLIMPO_PAYS].reverse();
  const tiers: BonusTier[] = [1, 2, 3];
  const what: Record<BonusTier, string> = {
    1: `${OLIMPO.tiers[1].spins} tiradas, multiplicador acumulado`,
    2: `${OLIMPO.tiers[2].spins} tiradas, más orbes`,
    3: `${OLIMPO.tiers[3].spins} tiradas, orbes desde x5`,
  };
  return `
  <h3>OLIMPO</h3>
  <p>Tablero 6x5 que paga con <b>8 o más símbolos iguales en cualquier sitio</b>. Los ganadores explotan y caen símbolos
  nuevos (cascada) mientras sigan saliendo premios.</p>
  <p><b>Orbes multiplicadores</b> (x2 a x500): al acabar las cascadas se suman y multiplican el premio de la tirada.
  En el bonus el multiplicador se va acumulando.</p>
  <table><tr><th>Símbolo</th><th>8-9</th><th>10-11</th><th>12+</th></tr>
  ${rows.map((s) => `<tr><td>${SYMBOLS[s].name}</td>${OLIMPO.pays[s].map((p) => `<td>${x(p)}</td>`).join('')}</tr>`).join('')}
  </table>
  <h3>Bonus</h3>
  <p>3 BONUS abren el bonus, 4 el semitocho y 5 o más el tocho. Con 3 BONUS dentro del bonus: +${OLIMPO.retrigger} tiradas.</p>
  <table><tr><th>Bonus</th><th>Qué tiene</th><th>Compra</th></tr>
  ${tiers.map((t) => `<tr><td>${BONUS_NAMES[t]} (${t + 2})</td><td>${what[t]}</td><td>${OLIMPO.buyPrice[t]}x</td></tr>`).join('')}
  </table>
  <p class="small">Premio máximo: ${MAX_WIN.toLocaleString('es-ES')}x la apuesta. Números provisionales, se afinan en la fase de matemáticas.</p>`;
}
