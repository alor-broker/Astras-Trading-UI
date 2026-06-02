export interface ClusterItem {
  price: number;
  buyQty: number;
  sellQty: number;
}

export interface TradesCluster {
  timestamp: number;
  tradeClusters: ClusterItem[];
}
