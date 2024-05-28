export interface LocalOrderTracker<T> {
  beforeOrderCreated: (order: T) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}
