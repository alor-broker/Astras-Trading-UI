export interface RecordMeta {
  timestamp: number;
}

export interface StorageRecord {
  key: string;
  meta: RecordMeta;
  value: any;
}

export enum GetRecordStatus {
  Success = 'success',
  NotFound = 'notFound',
  Error = 'error'
}

export interface GetRecordResult {
  status: GetRecordStatus;
  record: StorageRecord | null;
}
