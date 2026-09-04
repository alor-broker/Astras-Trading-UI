import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzModalComponent} from 'ng-zorro-antd/modal';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {concat, map, of, switchMap} from 'rxjs';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {AiSignalsService} from '../../services/ai-signals.service';
import {AiSignalsViewModelHelper} from '../../utils/ai-signals-view-model.helper';
import {SignalInstrumentsHelper} from '../../utils/signal-instruments.helper';

interface InstrumentsState {
  loading: boolean;
  tickers: string[] | null;
}

@Component({
  selector: 'ats-ticker-list-manager',
  imports: [
    InstrumentIcon,
    TranslocoDirective,
    NzButtonComponent,
    NzCheckboxComponent,
    NzEmptyComponent,
    NzIconDirective,
    NzModalComponent,
    NzSpinComponent
  ],
  templateUrl: './ticker-list-manager.html',
  styleUrl: './ticker-list-manager.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TickerListManager {
  readonly tickers = input.required<string[]>();

  readonly tickersChanged = output<string[]>();

  protected readonly isOpen = signal(false);

  protected readonly draftTickers = signal<ReadonlySet<string>>(new Set());

  private readonly refreshVersion = signal(0);

  private readonly aiSignalsService = inject(AiSignalsService);

  private readonly loadRequest = computed(() => this.isOpen() ? this.refreshVersion() : null);

  // Closing the dialog or destroying the component cancels an in-flight request.
  protected readonly instrumentsState = toSignal(toObservable(this.loadRequest).pipe(
    switchMap(request => request == null
      ? of<InstrumentsState>({loading: true, tickers: null})
      : concat(
        of<InstrumentsState>({loading: true, tickers: null}),
        this.aiSignalsService.getInstruments().pipe(
          map(response => ({
            loading: false,
            tickers: response == null ? null : SignalInstrumentsHelper.availableTickers(response.instruments)
          }))
        )
      ))
  ), {initialValue: {loading: true, tickers: null} as InstrumentsState});

  protected readonly selectedTickers = computed(() =>
    (this.instrumentsState().tickers ?? []).filter(ticker => this.draftTickers().has(ticker))
  );

  protected readonly allSelected = computed(() => this.selectedTickers().length > 0
    && this.selectedTickers().length === this.instrumentsState().tickers?.length);

  protected readonly partiallySelected = computed(() => this.selectedTickers().length > 0 && !this.allSelected());

  protected readonly canApply = computed(() => !this.instrumentsState().loading
    && this.instrumentsState().tickers != null);

  protected open(): void {
    this.draftTickers.set(new Set(this.tickers().map(ticker => AiSignalsViewModelHelper.normalizeTicker(ticker))));
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected retry(): void {
    this.refreshVersion.update(version => version + 1);
  }

  protected toggleAll(checked: boolean): void {
    this.draftTickers.set(new Set(checked ? this.instrumentsState().tickers ?? [] : []));
  }

  protected toggleTicker(ticker: string, checked: boolean): void {
    this.draftTickers.update(tickers => {
      const next = new Set(tickers);
      if (checked) {
        next.add(ticker);
      } else {
        next.delete(ticker);
      }
      return next;
    });
  }

  protected apply(): void {
    if (!this.canApply()) {
      return;
    }

    this.tickersChanged.emit(this.selectedTickers());
    this.close();
  }
}
