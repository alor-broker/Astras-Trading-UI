export interface RecordMeta {
  timestamp: number;
}

export interface StorageRecord {
  key: string;
  meta: RecordMeta;
  value: any;
}
