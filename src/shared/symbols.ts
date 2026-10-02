/** Símbolos comunes a las dos slots. */
export type PaySymbol = 'CUA' | 'CRZ' | 'CIR' | 'TRI' | 'MAC' | 'ELE' | 'IBE' | 'AND';
export type SymbolId = PaySymbol | 'WILD' | 'VS' | 'BONUS' | 'MULT';
export type SymbolKind = 'low' | 'high' | 'wild' | 'vs' | 'scatter' | 'mult';

export interface Cell {
  sym: SymbolId;
  /** Multiplicador de orbes (Olimpo) o de la columna VS (Duelo). */
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
  WILD: { name: 'Wild', kind: 'wild', color: 0xffffff },
  VS: { name: 'VS', kind: 'vs', color: 0xff3355 },
  BONUS: { name: 'Bonus', kind: 'scatter', color: 0xffe14d },
  MULT: { name: 'Multiplicador', kind: 'mult', color: 0x7cf3ff },
};

/** Símbolos que pagan, de menos a más premio. */
export const PAY_SYMBOLS: PaySymbol[] = ['CUA', 'CRZ', 'CIR', 'TRI', 'MAC', 'ELE', 'IBE', 'AND'];
/** Premium, de más a menos: Andy "el sacarino", Iberru, Elena, Macaco. */
export const PREMIUMS: PaySymbol[] = ['AND', 'IBE', 'ELE', 'MAC'];
