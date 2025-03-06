export interface InstrumentKey {
  symbol: string;
  exchange: string;
}

export enum SlotType {
  InstrumentKey = "instrument_key",
  Number = "number",
  String = "string",
  Array = "array",
  Boolean = "boolean"
}

export enum ExtendedEditors {
  MultilineText = 'multiline_text'
}

export type EditorType = SlotType | ExtendedEditors;
