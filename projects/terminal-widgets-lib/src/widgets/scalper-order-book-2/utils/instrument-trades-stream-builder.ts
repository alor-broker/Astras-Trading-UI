import {
  Observable,
  shareReplay
} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap
} from 'rxjs/operators';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentTradesService} from '@terminal-core-lib/features/instruments/services/instrument-trades.service';
import {InstrumentTradesItem} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';
import {ScalperOrderBookExtendedSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';

/** Глубина ленты сделок и подписки. */
const DEFAULT_DEPTH = 1000;
const SUBSCRIPTION_DEPTH = 100;

/**
 * Лёгкий поток обезличенных сделок для scalper-order-book-2.
 *
 * В отличие от переиспользуемого `DataContextBuilder.getInstrumentTradesStream`, не
 * копирует и не сортирует весь буфер на каждый тик: порядок по времени поддерживается
 * при вставке, обрезка по глубине - на месте (без перевыделения массива). Поток отдаёт
 * один и тот же буфер по ссылке; рендер читает его в кадре rAF, поэтому повторных копий
 * у потребителя не требуется.
 */
export class InstrumentTradesStreamBuilder {
  static build(
    settings$: Observable<ScalperOrderBookExtendedSettings>,
    instrumentTradesService: InstrumentTradesService,
    depth = DEFAULT_DEPTH
  ): Observable<InstrumentTradesItem[]> {
    return settings$.pipe(
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev.widgetSettings, curr.widgetSettings)),
      switchMap(settings => {
        // Буфер в порядке возрастания timestamp (как ожидает AggregatedTradesIterator).
        const buffer: InstrumentTradesItem[] = [];

        return instrumentTradesService.getNewTradesSubscription(settings.widgetSettings, SUBSCRIPTION_DEPTH).pipe(
          map(trade => {
            this.insertOrdered(buffer, trade);

            // Обрезка на месте (без аллокации нового массива на каждый тик).
            while (buffer.length > depth) {
              buffer.shift();
            }

            return buffer;
          }),
          startWith(buffer)
        );
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  /** Вставляет сделку, сохраняя возрастающий порядок по timestamp (обычно - append). */
  private static insertOrdered(buffer: InstrumentTradesItem[], trade: InstrumentTradesItem): void {
    const timestamp = trade.timestamp;
    if (buffer.length === 0 || timestamp >= buffer[buffer.length - 1].timestamp) {
      buffer.push(trade);
      return;
    }

    let low = 0;
    let high = buffer.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (buffer[mid].timestamp <= timestamp) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    buffer.splice(low, 0, trade);
  }
}
