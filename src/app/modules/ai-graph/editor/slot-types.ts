export interface InstrumentKey {
  symbol: string;
  exchange: string;
}

export enum SlotType {
  InstrumentKey = "instrumentKey",
  Number = "number",
  String = "string",
  Array = "array",
  Boolean = "boolean",
  Toggle = "toggle",
}
