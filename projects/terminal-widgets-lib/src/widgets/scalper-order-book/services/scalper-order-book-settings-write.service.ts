import {
  inject,
  Injectable
} from '@angular/core';
import {ScalperSharedSettingsService} from "./scalper-shared-settings.service";
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {
  InstrumentLinkedSettings,
  ScalperOrderBookWidgetSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

@Injectable()
export class ScalperOrderBookSettingsWriteService {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly scalperSharedSettingsService = inject(ScalperSharedSettingsService);

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
