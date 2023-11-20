import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  DetrendType,
  InstrumentsCorrelationRequest
} from "../../models/instruments-correlation.model";
import {
  combineLatest,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  Watchlist,
  WatchlistType
} from "../../../instruments/models/watchlist.model";
import { WatchListTitleHelper } from "../../../instruments/utils/watch-list-title.helper";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { WatchlistCollectionService } from "../../../instruments/services/watchlist-collection.service";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import { InstrumentsCorrelationSettings } from "../../models/instruments-correlation-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../shared/utils/observable-helper";

@Component({
  selector: 'ats-chart-filters',
  templateUrl: './chart-filters.component.html',
  styleUrls: ['./chart-filters.component.less']
})
export class ChartFiltersComponent implements OnInit {
  @Input({ required: true })
  guid!: string;

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

  @Output()
  filterChanged = new EventEmitter<InstrumentsCorrelationRequest>();

  readonly detrendTypes = Object.values(DetrendType);

  availableLists$!: Observable<Watchlist[]>;
  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
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

  private settings$!: Observable<InstrumentsCorrelationSettings>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<InstrumentsCorrelationSettings>(this.guid).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.availableLists$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(c => c.collection),
      shareReplay({ bufferSize: 1, refCount: true })
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
        if (!!historyList) {
          currentListId = historyList.id;
        } else {
          const defaultList = x.allLists.find(l => l.isDefault || l.type === WatchlistType.DefaultList);
          if (!!defaultList) {
            currentListId = defaultList.id;
          }
        }
      }

      if (!!currentListId) {
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
    this.widgetSettingsService.updateSettings<InstrumentsCorrelationSettings>(
      this.guid,
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
