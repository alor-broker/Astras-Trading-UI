import { InjectionToken } from "@angular/core";
import { InstrumentKey } from "../models/instruments/instrument-key.model";

export interface ActionsContext {
  instrumentSelected(instrumentKey: InstrumentKey, groupKey: string): void;
}

export const ACTIONS_CONTEXT = new InjectionToken<ActionsContext>('ActionsContext');
