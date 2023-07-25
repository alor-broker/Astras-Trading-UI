export interface RemoteStorageItemMeta {
  Id: string;
  Descriptions: string;
}

export interface RemoteStorageItem {
  UserSettings: {
    Description: string;
    Content: string;
  } | null
}
