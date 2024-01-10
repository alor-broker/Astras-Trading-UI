import { ScalperOrderBookWidgetSettings } from "../models/scalper-order-book-settings.model";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import {
  Observable,
  shareReplay
} from "rxjs";
import { map } from "rxjs/operators";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export class ScalperSettingsHelper {
  static toInstrumentLinkedSettings(settings: ScalperOrderBookWidgetSettings): ScalperOrderBookWidgetSettings {
    return {
      ...settings,
      ...settings.instrumentLinkedSettings?.[this.getInstrumentKey(settings)]
    };
  }

  static getInstrumentKey(instrumentKey: InstrumentKey): string {
    return `${instrumentKey.exchange}:${instrumentKey.symbol}:${instrumentKey.instrumentGroup}`;
  }

  static getSettingsStream(guid: string, settingsService: WidgetSettingsService): Observable<ScalperOrderBookWidgetSettings> {
    return settingsService.getSettings<ScalperOrderBookWidgetSettings>(guid).pipe(
      map(s => this.toInstrumentLinkedSettings(s)),
      shareReplay(1)
    );
  }
}
