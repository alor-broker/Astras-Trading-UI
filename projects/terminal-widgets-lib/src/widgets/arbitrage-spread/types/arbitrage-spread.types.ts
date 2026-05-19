import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {Side} from '@terminal-core-lib/common/types/side.types';

export interface ArbitrageSpread {
  id?: string;
  calculationFormula?: string;
  firstLeg: SpreadLeg;
  secondLeg: SpreadLeg;
  isThirdLeg: boolean;
  thirdLeg: SpreadLeg;
  buySpread: number | null;
  sellSpread: number | null;
}

export interface SpreadLeg {
  instrument: Instrument;
  quantity: number;
  ratio: number;
  portfolio: PortfolioKey;
  side?: Side;
  positionsCount?: number;
}
