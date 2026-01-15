export interface LimitOrderConfig {
  isBracketsSupported: boolean;
  unsupportedFields: Record<string, boolean>;
}

export interface MarketOrderConfig {
  unsupportedFields: Record<string, boolean>;
}

export interface OrdersConfig {
  marketOrder: {
    isSupported: boolean;
    orderConfig: MarketOrderConfig | null;
  };
  limitOrder: {
    isSupported: boolean;
    orderConfig: LimitOrderConfig | null;
  };
  stopOrder: {
    isSupported: boolean;
  };
}
