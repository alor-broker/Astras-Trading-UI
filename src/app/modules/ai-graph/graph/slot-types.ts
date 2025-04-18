﻿export interface InstrumentKey {
  symbol: string;
  exchange: string;
}

export interface PortfolioKey {
  portfolio: string;
  exchange: string;
}

export enum SlotType {
  Number = "number",
  String = "string",
  Array = "array",
  Boolean = "boolean",
  Date = "date",
  Portfolio = "portfolio",
  InstrumentsStr = "instruments_str",
  Any = "*"
}

export enum ExtendedEditors {
  MultilineText = 'multiline_text',
  Prompt = 'prompt',
  Select = 'select',
}

export type EditorType = SlotType | ExtendedEditors;
