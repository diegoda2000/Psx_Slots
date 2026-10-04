import { COLS, DUELO_CHARS, ROWS, SYMBOLS, type SymbolId } from '../../shared/symbols';
import { money } from '../../shared/text';
import { faceUrl, fsChipUrl, symbolUrl } from './art';
import { CHAR_REEL, DUELO, DUELO_PAYS, DUELO_TIER_NAMES, DUELO_TIERS, LINES, type DueloTier } from './math';

export const PITCH: Record<DueloTier, string> = {
  1: 'Más wilds de personaje',
  2: 'Rodillos de la muerte: cada personaje que cae en su rodillo se expande en todos',
};

/** Dibujo del símbolo (o su nombre si aún no tiene ilustración). */
function art(s: SymbolId, url = symbolUrl(s)) {
  return url ? `<img src="${url}" alt="${SYMBOLS[s].name}" />` : `<span class="no-art">${SYMBOLS[s].name}</span>`;
}

function payCard(s: (typeof DUELO_PAYS)[number], bet: number) {
  const rows = [6, 5, 4, 3]
    .map((n) => `<li><b>${n}</b>${money(DUELO.pays[s][n - 3] * DUELO.payScale * bet)}</li>`)
    .join('');
  return `<div class="pay-card">${art(s)}<ul>${rows}</ul></div>`;
}

function miniLine(line: number[], i: number) {
  let cells = '';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells += `<i${line[c] === r ? ' class="on"' : ''}></i>`;
  return `<div class="mini-line" title="Línea ${i + 1}">${cells}</div>`;
}

/** 1 de cada cuántas tiradas entra cada bonus en modo BonusHunt (fichas FS en 4 rodillos). */
function huntOdds(tier: DueloTier) {
  const p = DUELO.hunt.scatterPerReel;
  const prob = tier === 1 ? 4 * p ** 3 * (1 - p) : p ** 4;
  return Math.round(1 / prob).toLocaleString('es-ES');
}

export function rulesHtml(bet: number) {
  // De más a menos premio: arriba los 4 altos, abajo los 4 bajos (como en Life and Death).
  const best = [...DUELO_PAYS].reverse();
  const chars = [...DUELO_CHARS].sort((a, b) => CHAR_REEL[a] - CHAR_REEL[b]);
  const what: Record<DueloTier, string> = {
    1: 'Más wilds de personaje.',
    2: 'Rodillos de la muerte: el personaje que cae en su rodillo lo activa y desde entonces se expande en cualquier rodillo central.',
  };
  const fichas: Record<DueloTier, string> = { 1: '3', 2: '4' };
  const chip = fsChipUrl ? `<img class="chip" src="${fsChipUrl}" alt="FS" />` : 'FS';
  return `
  <h2>REGLAS Y PAGOS</h2>
  <h3>TABLA DE PAGOS</h3>
  <p class="small">Premios por línea con tu apuesta actual (${money(bet)}).</p>
  <div class="pay-grid">${best.slice(0, 4).map((s) => payCard(s, bet)).join('')}</div>
  <div class="pay-grid">${best.slice(4).map((s) => payCard(s, bet)).join('')}</div>

  <h3>WILDS MULTIPLICADORES Y RODILLOS EXPANDIDOS</h3>
  <p>Andy, Iberru, Majarias y Macaco son los cuatro wilds multiplicadores: sustituyen a todos los símbolos de la tabla de
  pagos y multiplican el premio de la línea en la que entran. Si una línea pasa por varios, sus multiplicadores se suman.</p>
  <p>Pueden caer en los rodillos 2 a 5 y como mucho sale uno de cada en pantalla. Cada uno tiene su rodillo: si cae en él
  y así entra en algún premio, se expande siempre a todo el rodillo. En otro rodillo hace de wild normal con su
  multiplicador.</p>
  <p>Cuanto mejor es el personaje, menos sale: Macaco es el más frecuente, después Majarias, luego Iberru, y Andy es el
  más raro (cada uno sale más o menos la mitad de veces que el anterior).</p>
  <div class="wild-grid">
    ${chars
      .map((c) => {
        const m = DUELO.wildMults[c].map(([v]) => `x${v}`).join(', ');
        return `<div class="wild-card" style="--c:#${SYMBOLS[c].color.toString(16).padStart(6, '0')}">
          ${art(c, faceUrl(c))}<strong>${SYMBOLS[c].name}</strong><small>Rodillo ${CHAR_REEL[c] + 1}</small><span>${m}</span></div>`;
      })
      .join('')}
  </div>

  <h3>LÍNEAS DE PAGO</h3>
  <p>Se gana con 3 o más símbolos iguales seguidos en una de las ${LINES.length} líneas, de izquierda a derecha y empezando
  por el primer rodillo.</p>
  <div class="lines-grid">${LINES.map(miniLine).join('')}</div>

  <h3>BONUS</h3>
  <p>${chip} La ficha FS es el scatter, como mucho una por rodillo: 3 fichas abren el BONUS y 4, el TOCHO.
  Dentro del bonus, 2 fichas dan
  +${DUELO.retrigger[2]} tiradas y 3 o más, +${DUELO.retrigger[3]}.</p>
  <table>
    <tr><th>Bonus</th><th>Fichas</th><th>Tiradas</th><th>Qué tiene</th><th>Compra</th></tr>
    ${DUELO_TIERS.map(
      (t) =>
        `<tr><td>${DUELO_TIER_NAMES[t]}</td><td>${fichas[t]}</td><td>${DUELO.tiers[t].spins}</td><td>${what[t]}</td><td>${money(DUELO.buyPrice[t] * bet)}</td></tr>`,
    )
      .join('')}
  </table>

  <h3>BONUS HUNT</h3>
  <p>Se activa desde el panel de compra y se queda puesto hasta quitarlo. Cada tirada cuesta ${DUELO.hunt.cost} veces la
  apuesta (${money(DUELO.hunt.cost * bet)}) y las fichas FS salen mucho más: el bonus entra unas 5 o 6 veces más a menudo
  (BONUS 1 de cada ~${huntOdds(1)} tiradas, TOCHO 1 de cada ~${huntOdds(2)}). Los premios se pagan sobre la apuesta normal.
  Mientras está activo no se puede comprar bonus. Mismo RTP que el juego normal.</p>
  <p class="small">Premio máximo: ${DUELO.maxWin.toLocaleString('es-ES')} veces la apuesta. RTP simulado ≈ 93,6%. Demo con saldo ficticio.</p>`;
}
