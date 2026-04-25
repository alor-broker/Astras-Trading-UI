import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Side } from "../../../shared/models/enums/side.model";

export enum TradeDirection {
  All = 'all',
  Buy = 'buy',
  Sell = 'sell'
}

export interface RobotConfig {
  isEnabled: boolean;
  direction: TradeDirection;
  buyThreshold: number | null;
  sellThreshold: number | null;
  volume: number | null;
  maxVolume: number | null;
  closeThreshold: number | null;
  cooldownSeconds: number;
}

export interface ArbitrageRobot {
  id?: string;
  calculationFormula?: string;
  firstLeg: RobotSpreadLeg;
  secondLeg: RobotSpreadLeg;
  isThirdLeg: boolean;
  thirdLeg: RobotSpreadLeg;
  buySpread: number | null;
  sellSpread: number | null;
  robotConfig: RobotConfig;
}

export interface RobotSpreadLeg {
  instrument: Instrument;
  quantity: number;
  ratio: number;
  portfolio: PortfolioKey;
  side?: Side;
  positionsCount?: number;
}

export const defaultRobotConfig = (): RobotConfig => ({
  isEnabled: false,
  direction: TradeDirection.All,
  buyThreshold: null,
  sellThreshold: null,
  volume: null,
  maxVolume: null,
  closeThreshold: null,
  cooldownSeconds: 5,
});
