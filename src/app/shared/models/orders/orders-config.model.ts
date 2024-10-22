export interface LimitOrderConfig {
  isBracketsSupported: boolean;
}

export interface OrdersConfig {
  marketOrder: {
    isSupported: boolean;
  };
  limitOrder: {
    isSupported: boolean;
    orderConfig: LimitOrderConfig | null;
  };
  stopOrder: {
    isSupported: boolean;
  };
}
