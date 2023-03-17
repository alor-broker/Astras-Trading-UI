export const maxDayChange = 5;

export interface TreemapNode {
  dayChange: number;
  dayChangeAbs: number;
  marketCap: number;
  sector: string;
  symbol: string;
}
