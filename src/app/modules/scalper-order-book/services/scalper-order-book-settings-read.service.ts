import { Injectable } from '@angular/core';
import { ScalperSharedSettingsService } from "./scalper-shared-settings.service";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import {
  filter,
  Observable,
  shareReplay
} from "rxjs";
import { ScalperOrderBookExtendedSettings } from "../models/scalper-order-book-data-context.model";
import { mapWith } from "../../../shared/utils/observable-helper";
import { InstrumentsService } from "../../instruments/services/instruments.service";
import {
  InstrumentLinkedSettings,
  ScalperOrderBookWidgetSettings
} from "../models/scalper-order-book-settings.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookSettingsReadService {
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly scalperSharedSettingsService: ScalperSharedSettingsService,
    private readonly instrumentsService: InstrumentsService
  ) {
  }

  static getObsoleteInstrumentKey(instrumentKey: InstrumentKey): string {
    return `${instrumentKey.exchange}:${instrumentKey.symbol}:${instrumentKey.instrumentGroup}`;
  }

  readSettings(widgetGuid: string): Observable<ScalperOrderBookExtendedSettings> {
    return this.widgetSettingsService.getSettings<ScalperOrderBookWidgetSettings>(widgetGuid).pipe(
      mapWith(
        settings => this.instrumentsService.getInstrument(settings),
        (widgetSettings, instrument) => ({
          instrument,
          widgetSettings: {
            ...widgetSettings,
            instrumentGroup: widgetSettings.instrumentGroup ?? instrument?.instrumentGroup ?? ''
          }
        })
      ),
      filter(x => x.instrument != null),
      mapWith(x => this.scalperSharedSettingsService.getSettingsForInstrument({
          symbol: x.widgetSettings.symbol,
          exchange: x.widgetSettings.exchange,
          board: x.widgetSettings.instrumentGroup
        }),
        (source, output) => ({
          instrument: source.instrument!,
          widgetSettings: this.migrateObsoleteSettings(source.widgetSettings, output)
        })
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private migrateObsoleteSettings(
    currentSettings: ScalperOrderBookWidgetSettings,
    sharedSettings: Partial<InstrumentLinkedSettings> | null
  ): ScalperOrderBookWidgetSettings {
    const obsoleteInstrumentKey = ScalperOrderBookSettingsReadService.getObsoleteInstrumentKey(currentSettings);

    return {
      ...currentSettings,
      ...currentSettings.instrumentLinkedSettings?.[obsoleteInstrumentKey],
      ...sharedSettings,
      instrumentLinkedSettings: undefined
    };
  }
}
