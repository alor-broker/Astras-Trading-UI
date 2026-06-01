export interface UserSettings {
  Key: string;
  Group?: string;
  Description: string;
  Content: string;
}

export interface RemoteStorageItem {
  UserSettings: UserSettings | null;
}

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
