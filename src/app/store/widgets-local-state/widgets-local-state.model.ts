export interface WidgetStateRecord {
  widgetGuid: string;
  recordKey: string;
  content: RecordContent;
  restorable: boolean;
}

export type RecordContent = object;
