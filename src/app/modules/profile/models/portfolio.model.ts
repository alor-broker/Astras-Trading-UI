import { Position } from "./position.model";

export interface Portfolio {
  longPositions: Position[],
  shortPositions: Position[],
  openPositions: Position[],
  totalPositions: number,
  freeMoney: number,
  todayProfit: number,
  todayProfitPersent: number
}
