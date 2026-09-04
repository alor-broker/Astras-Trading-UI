import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable
} from '@angular/core/rxjs-interop';
import {
  AsyncPipe,
  DatePipe
} from '@angular/common';
import {
  combineLatest,
  concat,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap
} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {AiSignalsService} from '../../services/ai-signals.service';
import {AiSignalsViewModelHelper} from '../../utils/ai-signals-view-model.helper';
import {
  AiSignalsWidgetSettings,
  defaultAiSignalsWidgetSettings
} from '../../widget-settings.types';
import {
  aiSignalsTickersRecordKey,
  ContentDisplayStatus,
  SignalRowViewModel,
  TickersStateRecord
} from '../../types/ai-signals-view.types';
import {TickerListManager} from '../ticker-list-manager/ticker-list-manager';
import {SignalListItem} from '../signal-list-item/signal-list-item';
import {SignalDetailsDialog} from '../signal-details-dialog/signal-details-dialog';

interface ContentState {
  status: ContentDisplayStatus;
  rows: SignalRowViewModel[] | null;
}

@Component({
  selector: 'ats-ai-signals-content',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    DatePipe,
    NzEmptyComponent,
    NzSpinComponent,
    NzButtonComponent,
    NzIconDirective,
    NzTooltipDirective,
    TickerListManager,
    SignalListItem,
    SignalDetailsDialog
  ],
  templateUrl: './ai-signals-content.html',
  styleUrl: './ai-signals-content.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSignalsContent implements OnInit {
  readonly guid = input.required<string>();

  readonly instrumentSelected = output<InstrumentKey>();

  protected readonly displayStatuses = ContentDisplayStatus;

  // Loading until the tickers record is restored from the widget local state
  protected readonly displayStatus = signal<ContentDisplayStatus>(ContentDisplayStatus.Loading);

  protected readonly rows = signal<SignalRowViewModel[] | null>(null);

  protected readonly lastUpdatedAt = signal<Date | null>(null);

  protected readonly selectedSignal = signal<SignalRowViewModel | null>(null);

  protected readonly isDetailsOpen = computed(() => this.selectedSignal() != null);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly aiSignalsService = inject(AiSignalsService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  // the saved watch-list is owned by WidgetLocalStateService; this stream is the single source of truth
  protected readonly savedTickers$ = toObservable(this.guid).pipe(
    switchMap(guid => this.widgetLocalStateService.getStateRecord<TickersStateRecord>(
      guid,
      aiSignalsTickersRecordKey
    )),
    map(record => record?.tickers ?? []),
    distinctUntilChanged((previous, current) => ArrayHelper.isArrayEqual(previous, current, (a, b) => a === b)),
    shareReplay({bufferSize: 1, refCount: true})
  );

  // polling stops while the details dialog is open and resumes with an immediate
  // catch-up request on close (withRefresh restarts its timer when the gate reopens)
  private readonly isRefreshAllowed$ = combineLatest([
    this.applicationStatusService.isActive$,
    toObservable(this.isDetailsOpen)
  ]).pipe(
    map(([isAppActive, isDetailsOpen]) => isAppActive && !isDetailsOpen),
    distinctUntilChanged()
  );

  private readonly manualRefresh$ = new Subject<void>();

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.manualRefresh$.complete());

    combineLatest({
      tickers: this.savedTickers$,
      intervalSec: this.getRefreshIntervalSecStream()
    }).pipe(
      switchMap(source => this.getContentStateStream(source.tickers, source.intervalSec)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.displayStatus.set(state.status);
      this.rows.set(state.rows);

      if (state.status === ContentDisplayStatus.Loaded) {
        this.lastUpdatedAt.set(new Date());
      }
    });
  }

  protected refresh(): void {
    this.manualRefresh$.next();
  }

  protected openDetails(row: SignalRowViewModel): void {
    if (AiSignalsViewModelHelper.canOpenDetails(row)) {
      this.selectedSignal.set(row);
    }
  }

  private getRefreshIntervalSecStream(): Observable<number> {
    return this.widgetSettingsService.getSettings<AiSignalsWidgetSettings>(this.guid()).pipe(
      map(settings => settings.refreshIntervalSec ?? defaultAiSignalsWidgetSettings.refreshIntervalSec),
      distinctUntilChanged()
    );
  }

  private getContentStateStream(tickers: string[], intervalSec: number): Observable<ContentState> {
    if (tickers.length === 0) {
      return of({
        status: ContentDisplayStatus.NoTickers,
        rows: null
      });
    }

    let isInitialLoad = true;

    return merge(
      createRefresh(intervalSec * 1000, this.isRefreshAllowed$).pipe(map(() => false)),
      this.manualRefresh$.pipe(map(() => true))
    ).pipe(
      switchMap(isManualRefresh => {
        // loading replaces the list only for the first load, tickers change and manual refresh;
        // background polling updates the rendered list silently
        const showLoading = isManualRefresh || isInitialLoad;
        isInitialLoad = false;

        const request$ = this.aiSignalsService.getLatestSignals(tickers).pipe(
          map(response => {
            if (response == null) {
              return {
                status: ContentDisplayStatus.Error,
                rows: null
              };
            }

            return {
              status: ContentDisplayStatus.Loaded,
              rows: AiSignalsViewModelHelper.toRowViewModels(tickers, response)
            };
          })
        );

        if (!showLoading) {
          return request$;
        }

        return concat(
          of({
            status: ContentDisplayStatus.Loading,
            rows: null
          }),
          request$
        );
      })
    );
  }

  protected saveTickers(tickers: string[]): void {
    this.widgetLocalStateService.setStateRecord<TickersStateRecord>(
      this.guid(),
      aiSignalsTickersRecordKey,
      {tickers},
      true
    );
  }
}
