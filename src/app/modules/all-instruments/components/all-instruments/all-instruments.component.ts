import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { AllInstrumentsService } from "../../services/all-instruments.service";
import { interval, shareReplay, Subject, Subscription, switchMap, takeUntil } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AllInstrumentsSettings } from "../../../../shared/models/settings/all-instruments-settings.model";
import { AllInstruments, AllInstrumentsFilters } from "../../model/all-instruments.model";

@Component({
  selector: 'ats-all-instruments',
  templateUrl: './all-instruments.component.html',
  styleUrls: ['./all-instruments.component.less']
})
export class AllInstrumentsComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private instrumentsSub!: Subscription;
  private filters: AllInstrumentsFilters = {
    limit: 50,
    offset: 0
  };

  @Input() guid!: string;
  @Input() public resize!: EventEmitter<DashboardItem>;

  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public instrumentsList: Array<AllInstruments> = [];
  public isLoading = false;

  public allColumns: ColumnsSettings[] = [
    {
      name: 'shortName',
      displayName: 'Тикер',
      sortFn: this.getSortFn('symbol'),
      isFiltering: true,
      isOpenedFilter: false
    },
    {
      name: 'dailyGrowth',
      displayName: 'Рост за сегодня',
      classFn: data => data.dailyGrowth < 0 ? 'sell' : 'buy',
      sortFn: this.getSortFn('dailyGrowth')
    },
    {name: 'tradeVolume', displayName: 'Объём торгов', sortFn: this.getSortFn('tradeVolume')},
    {
      name: 'exchange',
      displayName: 'Биржа',
      sortFn: this.getSortFn('exchange'),
      isFiltering: true,
      isOpenedFilter: false
    },
    {name: 'lotSize', displayName: 'Лотность'},
    {name: 'price', displayName: 'Цена', sortFn: this.getSortFn('price')},
    {name: 'priceMax', displayName: 'Макс. цена'},
    {name: 'priceMin', displayName: 'Мин. цена'},
    {name: 'priceScale', displayName: 'Шаг цены', sortFn: this.getSortFn('priceScale')},
    {name: 'yield', displayName: 'Доходность', sortFn: this.getSortFn('yield')},
  ];
  public displayedColumns: ColumnsSettings[] = [];

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: AllInstrumentsService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getInstruments();

    this.settingsService.getSettings<AllInstrumentsSettings>(this.guid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.displayedColumns = this.allColumns.filter(col => settings.allInstrumentsColumns.includes(col.name));
      });

    this.resize
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.tableContainerHeight = data.height ?? 0;
        this.tableContainerWidth = data.width!;
        this.cdr.markForCheck();
      });
  }

  scrolled() {
    this.filters = {
      ...this.filters,
      offset: this.instrumentsList.length
    };
    this.getInstruments();
  }

  applyFilter(filters: any) {
    if (filters.shortName || this.filters.shortName) {
      filters.query = filters.shortName;
      delete filters.shortName;
    }

    this.filters = {
      ...this.filters,
      ...filters,
      offset: 0
    };
    this.getInstruments(true);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private getInstruments(isFiltersChanged = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.service.getAllInstruments(this.filters)
      .subscribe(res => {
        if (isFiltersChanged) {
          this.instrumentsList = res;
        } else {
          this.instrumentsList = [...this.instrumentsList, ...res];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });

    if (this.instrumentsSub) {
      this.instrumentsSub.unsubscribe();
    }

    const filterForSub = JSON.parse(JSON.stringify(this.filters));
    filterForSub.limit += filterForSub.offset;
    filterForSub.offset = 0;

    this.instrumentsSub = interval(10_000)
      .pipe(
        switchMap(() => this.service.getAllInstruments(filterForSub)),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.instrumentsList = res;
        this.cdr.markForCheck();
      });
  }

  private getSortFn(orderBy: string): (dir: string | null) => void {
    return (dir: string | null) => {
      let filter = {};
      if (dir) {
        filter = {descending: dir === 'descend', orderBy};
      } else {
        delete this.filters.descending;
        delete this.filters.orderBy;
      }
      this.applyFilter(filter);
    };
  }

}
