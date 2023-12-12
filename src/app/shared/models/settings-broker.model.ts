export interface RecordMeta {
  timestamp: number;
}

export interface StorageRecord {
  meta: RecordMeta;
  value: any;
}
