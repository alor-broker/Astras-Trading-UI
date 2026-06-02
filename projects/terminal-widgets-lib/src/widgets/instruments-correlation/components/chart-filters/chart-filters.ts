import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {WatchlistCollectionService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection.service';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {
  DetrendType,
  InstrumentsCorrelationRequest
} from '@terminal-widgets-lib/widgets/instruments-correlation/types/instruments-correlation.types';
import {
  Watchlist,
  WatchlistType
} from '@terminal-core-lib/features/watchlist/types/watchlist.types';
import {WatchListTitleHelper} from '@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler';
import {InstrumentsCorrelationWidgetSettings} from '@terminal-widgets-lib/widgets/instruments-correlation/widget-settings.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'ats-chart-filters',
  templateUrl: './chart-filters.html',
  styleUrls: ['./chart-filters.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzSelectComponent,
    NzTooltipDirective,
    NzOptionComponent,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ChartFilters implements OnInit {
  readonly guid = input.required<string>();

  readonly timeframes = [
    {
      key: 'month',
      value: 30
    },
    {
      key: 'quarter',
      value: 90
    },
    {
      key: 'halfYear',
      value: 180
    },
    {
      key: 'year',
      value: 360
    },
  ];

  readonly filterChanged = output<InstrumentsCorrelationRequest>();

  readonly detrendTypes = Object.values(DetrendType);

  availableLists$!: Observable<Watchlist[]>;

  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  private readonly formBuilder = inject(FormBuilder);

  parametersForm = this.formBuilder.group({
    targetListId: this.formBuilder.control<string | null>(
      null,
      Validators.required
    ),
    days: this.formBuilder.nonNullable.control(
      this.timeframes[0].value,
      Validators.required
    ),
    detrendType: this.formBuilder.nonNullable.control(
      DetrendType.Linear,
      Validators.required
    )
  });

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly destroyRef = inject(DestroyRef);

  private settings$!: Observable<InstrumentsCorrelationWidgetSettings>;

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<InstrumentsCorrelationWidgetSettings>(this.guid()).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.availableLists$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(c => c.collection),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.setInitialRequestValues();

    this.parametersForm.valueChanges.pipe(
      startWith(this.parametersForm.value),
      filter(() => this.parametersForm.valid),
      mapWith(
        () => this.availableLists$,
        (filters, collection) => {
          return {
            instruments: collection.find(i => i.id === filters.targetListId!)!.items,
            days: filters.days!,
            detrendType: filters.detrendType!
          } as InstrumentsCorrelationRequest;
        }
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(r => {
      this.saveCurrentParameters();
      this.filterChanged.emit(r);
    });
  }

  private setInitialRequestValues(): void {
    combineLatest({
        settings: this.settings$,
        allLists: this.availableLists$
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      const lastParams = x.settings.lastRequestParams;

      let currentListId: string | null = null;
      if (x.allLists.find(l => l.id === lastParams?.listId)) {
        currentListId = lastParams!.listId;
      } else {
        const historyList = x.allLists.find(l => l.type === WatchlistType.HistoryList);
        if (historyList) {
          currentListId = historyList.id;
        } else {
          const defaultList = x.allLists.find(l => (l.isDefault ?? false) || l.type === WatchlistType.DefaultList);
          if (defaultList) {
            currentListId = defaultList.id;
          }
        }
      }

      if (currentListId != null) {
        this.parametersForm.controls.targetListId.setValue(currentListId);
      }

      this.parametersForm.controls.days.setValue(lastParams?.days ?? this.timeframes[0].value);
      this.parametersForm.controls.detrendType.setValue(lastParams?.detrendType ?? DetrendType.Linear);
    });
  }

  private saveCurrentParameters(): void {
    if (!this.parametersForm.valid) {
      return;
    }

    const formValue = this.parametersForm.value;
    this.widgetSettingsService.updateSettings<InstrumentsCorrelationWidgetSettings>(
      this.guid(),
      {
        lastRequestParams: {
          listId: formValue.targetListId!,
          days: formValue.days!,
          detrendType: formValue.detrendType!
        }
      }
    );
  }
}
