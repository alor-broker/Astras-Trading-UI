export interface InstrumentKey {
  symbol: string;
  exchange: string;
}

export enum SlotType {
  InstrumentKey = "instrument_key",
  Number = "number",
  String = "string",
  Array = "array",
  Boolean = "boolean",
  Toggle = "toggle",
}
