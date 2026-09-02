import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
  afterNextRender
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {aiSignalsDefaultExchange} from '../../types/ai-signals-view.types';
import {AiSignalsViewModelHelper} from '../../utils/ai-signals-view-model.helper';

@Component({
  selector: 'ats-ticker-list-manager',
  imports: [
    TranslocoDirective,
    NzTagComponent,
    NzIconDirective,
    InlineInstrumentSearch
  ],
  templateUrl: './ticker-list-manager.html',
  styleUrl: './ticker-list-manager.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerListManager {
  readonly tickers = input.required<string[]>();

  readonly maxTickersCount = input.required<number>();

  readonly tickerAdded = output<string>();

  readonly tickerRemoved = output<string>();

  protected readonly searchExchange = aiSignalsDefaultExchange;

  protected readonly showSearch = signal(false);

  protected readonly showDuplicateHint = signal(false);

  protected readonly canAddMore = computed(() => this.tickers().length < this.maxTickersCount());

  private readonly searchComponent = viewChild(InlineInstrumentSearch);

  private readonly injector = inject(Injector);

  protected openSearch(): void {
    this.showDuplicateHint.set(false);
    this.showSearch.set(true);

    afterNextRender(
      () => this.searchComponent()?.setFocus(),
      {injector: this.injector}
    );
  }

  protected closeSearch(): void {
    this.showSearch.set(false);
    this.showDuplicateHint.set(false);
  }

  protected onInstrumentSelected(instrumentKey: InstrumentKey | null): void {
    if (instrumentKey == null) {
      this.closeSearch();
      return;
    }

    const ticker = AiSignalsViewModelHelper.normalizeTicker(instrumentKey.symbol);
    if (ticker.length === 0) {
      return;
    }

    if (this.tickers().includes(ticker)) {
      this.showDuplicateHint.set(true);
      return;
    }

    this.closeSearch();
    this.tickerAdded.emit(ticker);
  }

  protected removeTicker(ticker: string): void {
    this.tickerRemoved.emit(ticker);
  }
}
