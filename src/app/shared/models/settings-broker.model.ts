export interface RecordMeta {
  timestamp: number;
}

export interface StorageRecord<T> {
  meta: RecordMeta;
  value: T;
}
