export interface Event {
  key: string;
  payload?: unknown;
}

export interface StoredEvent extends Event {
  timestamp: number;
}
