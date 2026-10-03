/** Símbolos de las dos slots. Cada slot elige cuáles usa para pagar. */
export type Low = 'CUA' | 'CRZ' | 'CIR' | 'TRI';
export type Premium = 'AND' | 'IBE' | 'ELE' | 'MAC';
/** Símbolos de pago de Duelo (ilustraciones del usuario). SIM2 y SIM3 son huecos provisionales. */
export type DueloSym = 'HUTT' | 'SIM2' | 'SIM3' | 'TERNASCO' | 'RADIO' | 'OMG' | 'REMOS' | 'RATA';
export type PaySymbol = Low | Premium | DueloSym;
/** Personajes de Duelo (los 4 jinetes): Majarias ocupa el sitio de Elena. */
export type DueloChar = 'AND' | 'IBE' | 'MAJ' | 'MAC';
/** Wild multiplicador de cada personaje (Duelo). */
export type CharWild = 'W_AND' | 'W_IBE' | 'W_MAJ' | 'W_MAC';
export type SymbolId = PaySymbol | DueloChar | CharWild | 'BONUS' | 'MULT';
export type SymbolKind = 'low' | 'high' | 'item' | 'cwild' | 'scatter' | 'mult';

export interface Cell {
  sym: SymbolId;
  /** Multiplicador de orbes (Olimpo) o del wild de personaje (Duelo). */
  mult?: number;
}
export type Grid = Cell[][]; // grid[col][row]

export const COLS = 6;
export const ROWS = 5;

export const SYMBOLS: Record<SymbolId, { name: string; kind: SymbolKind; color: number }> = {
  CUA: { name: 'Cuadrado', kind: 'low', color: 0xff7ad9 },
  CRZ: { name: 'Equis', kind: 'low', color: 0x6aa8ff },
  CIR: { name: 'Círculo', kind: 'low', color: 0xff5868 },
  TRI: { name: 'Triángulo', kind: 'low', color: 0x3ee0a0 },
  MAC: { name: 'Macaco', kind: 'high', color: 0xffc72e },
  ELE: { name: 'Elena', kind: 'high', color: 0x2ed3e0 },
  IBE: { name: 'Iberru', kind: 'high', color: 0xa86bff },
  AND: { name: 'Andy', kind: 'high', color: 0xffd23e },
  MAJ: { name: 'Majarias', kind: 'high', color: 0xd8342b },
  HUTT: { name: 'Andy the Hutt', kind: 'item', color: 0xf2b81c },
  SIM2: { name: 'Por decidir', kind: 'item', color: 0x8a857c },
  SIM3: { name: 'Por decidir', kind: 'item', color: 0x8a857c },
  TERNASCO: { name: 'Ternasco', kind: 'item', color: 0xf3e6d3 },
  RADIO: { name: 'Radio', kind: 'item', color: 0xc9c9c9 },
  OMG: { name: 'OMG Bro', kind: 'item', color: 0xffd60a },
  REMOS: { name: 'Remos', kind: 'item', color: 0x2d7da0 },
  RATA: { name: 'Rata', kind: 'item', color: 0x8b8b8b },
  W_AND: { name: 'Wild Andy', kind: 'cwild', color: 0xffd23e },
  W_IBE: { name: 'Wild Iberru', kind: 'cwild', color: 0xa86bff },
  W_MAJ: { name: 'Wild Majarias', kind: 'cwild', color: 0xd8342b },
  W_MAC: { name: 'Wild Macaco', kind: 'cwild', color: 0xffc72e },
  BONUS: { name: 'Bonus', kind: 'scatter', color: 0xffe14d },
  MULT: { name: 'Multiplicador', kind: 'mult', color: 0x7cf3ff },
};

/** Premium, de más a menos: Andy "el sacarino", Iberru, Elena, Macaco. */
export const PREMIUMS: Premium[] = ['AND', 'IBE', 'ELE', 'MAC'];

/** Personajes de Duelo, de más a menos: Andy, Iberru, Majarias, Macaco. */
export const DUELO_CHARS: DueloChar[] = ['AND', 'IBE', 'MAJ', 'MAC'];

export const wildOf = (p: DueloChar) => `W_${p}` as CharWild;
export const charOf = (w: CharWild) => w.slice(2) as DueloChar;
