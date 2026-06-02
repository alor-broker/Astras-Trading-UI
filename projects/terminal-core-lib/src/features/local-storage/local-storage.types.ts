export interface LocalStorageChanges {
  key: string;
}

export interface OuterChanges {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
}
