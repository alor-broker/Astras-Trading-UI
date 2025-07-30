import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export interface Section {
  title: string;
  description: string;
  ideas: Idea[];
}

export interface Idea {
  instrumentKey: InstrumentKey;
  shortName: string;
}
