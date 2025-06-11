export interface InstrumentKey {
  symbol: string;
  exchange: string;
}

export interface Portfolio {
  portfolio: string;
  exchange: string;
  agreement: string;
  market: string;
}

export enum SlotType {
  Number = "number",
  String = "string",
  Array = "array",
  Boolean = "boolean",
  Date = "date",
  Portfolio = "portfolio",
  Market = "market",
  InstrumentsStr = "instruments_str",
  Any = "*"
}

export enum ExtendedEditors {
  MultilineText = 'multiline_text',
  Prompt = 'prompt',
  Select = 'select',
}

export type EditorType = SlotType | ExtendedEditors;
