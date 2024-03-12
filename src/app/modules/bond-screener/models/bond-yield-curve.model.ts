export interface BondYieldsResponse {
  bonds: {
    nodes: BondYield[];
  };
}

export interface BondYield {
  basicInformation: {
    symbol: string;
    shortName: string;
    exchange: string;
  };

  maturityDate: Date;
  duration: number;
  durationMacaulay: number;

  yield: {
    currentYield: number;
    yieldToMaturity: number;
  };
}

export enum DurationType {
  MaturityDateBased = 'maturityDateBased',
  ModifiedDuration = 'modifiedDuration',
  MacaulayDuration = 'macaulayDuration'
}

export enum YieldType {
  CurrentYield = 'currentYield',
  YieldToMaturity = 'yieldToMaturity'
}
