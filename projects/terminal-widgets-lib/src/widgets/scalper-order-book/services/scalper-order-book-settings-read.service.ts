import {
  inject,
  Injectable
} from '@angular/core';
import {ScalperSharedSettingsService} from "./scalper-shared-settings.service";
import {
  filter,
  Observable,
  shareReplay
} from "rxjs";
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {ScalperOrderBookExtendedSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  InstrumentLinkedSettings,
  ScalperOrderBookWidgetSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';

@Injectable()
export class ScalperOrderBookSettingsReadService {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly scalperSharedSettingsService = inject(ScalperSharedSettingsService);

  private readonly instrumentsService = inject(InstrumentsService);

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
