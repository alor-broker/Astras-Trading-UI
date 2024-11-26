import { Injectable } from '@angular/core';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { ScalperSharedSettingsService } from "./scalper-shared-settings.service";
import {
  InstrumentLinkedSettings,
  ScalperOrderBookWidgetSettings
} from "../models/scalper-order-book-settings.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookSettingsWriteService {
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly scalperSharedSettingsService: ScalperSharedSettingsService
  ) {
  }

  updateInstrumentLinkedSettings(settings: Partial<InstrumentLinkedSettings>, instrumentKey: InstrumentKey): void {
    this.scalperSharedSettingsService.updateSettingsForInstrument(
      {
        symbol: instrumentKey.symbol,
        exchange: instrumentKey.exchange,
        board: instrumentKey.instrumentGroup ?? ''
      },
      settings
    );
  }

  updateWidgetSettings(settings: Partial<ScalperOrderBookWidgetSettings>, widgetGuid: string): void {
    this.widgetSettingsService.updateSettings(widgetGuid, settings);
  }
}
