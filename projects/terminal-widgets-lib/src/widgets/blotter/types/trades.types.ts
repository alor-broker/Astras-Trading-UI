import {Trade} from '@terminal-core-lib/features/portfolios/types/trade.types';

export interface DisplayTrade extends Trade {
  volume: number;
  displayDate: Date;
}
