import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { AllTradesService } from "../../services/all-trades.service";
import { ColumnsSettings } from "../../../../shared/models/columns-settings.model";
import { DatePipe } from "@angular/common";
import { startOfDay, toUnixTimestampSeconds } from "../../../../shared/utils/datetime";
import { AllTradesSettings } from "../../../../shared/models/settings/all-trades-settings.model";
import { switchMap, tap } from "rxjs/operators";
import { Observable, Subject, takeUntil } from "rxjs";
import { AllTradesItem } from "../../models/all-trades.model";

@Component({
  selector: 'ats-all-trades',
  templateUrl: './all-trades.component.html',
  styleUrls: ['./all-trades.component.less'],
})
export class AllTradesComponent implements OnInit, OnDestroy {

  @Input() public resize!: EventEmitter<DashboardItem>;
  @Input() public heightAdjustment!: number;

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private settings: AllTradesSettings | null = null;
  private datePipe = new DatePipe('ru-RU');
  private take = 50;
  private isEndOfList = false;

  public tableContainerHeight: number = 0;
  public tableContainerWidth: number = 0;
  public tradesList: Array<AllTradesItem> = [];
  public isLoading = false;

  public columns: ColumnsSettings[] = [
    {name: 'qty', displayName: 'Кол-во', classFn: data => data.side},
    {name: 'price', displayName: 'Цена'},
    {name: 'timestamp', displayName: 'Время', transformFn: (data: number) => this.datePipe.transform(data, 'HH:mm:ss')},
    {
      name: 'side',
      displayName: 'Сторона',
      classFn: data => data.side
    },
    {name: 'oi', displayName: 'Откр. интерес'},
    {name: 'existing', displayName: 'Новое событие', transformFn: (data: boolean) => data ? 'Да' : 'Нет'},
  ];

  constructor(
    private allTradesService: AllTradesService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.allTradesService.settings$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = settings;
        this.settingsChange();
      });

    this.resize
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.tableContainerHeight = data.height! - this.heightAdjustment;
        this.tableContainerWidth = data.width!;
        this.cdr.markForCheck();
      });
  }

  public scrolled(): void {
    if (!this.settings || this.isEndOfList || this.isLoading) return;

    this.getTradesListReq(toUnixTimestampSeconds(new Date(this.tradesList[this.tradesList.length - 1].timestamp)))
      .subscribe(res => {
        const lastItemIndex = res.findIndex(item => JSON.stringify(item) === JSON.stringify(this.tradesList[this.tradesList.length - 1]));
        this.isEndOfList = lastItemIndex === res.length - 1;

        if (lastItemIndex !== -1) {
          this.tradesList = [...this.tradesList, ...res.slice(lastItemIndex + 1)];
        } else {
          this.tradesList = [...this.tradesList, ...res];
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private settingsChange(): void {
    if (!this.settings) return;

    this.getTradesListReq(toUnixTimestampSeconds(new Date()))
      .pipe(
        tap(res => {
          this.tradesList = res;
          this.isEndOfList = false;
          this.cdr.markForCheck();
        }),
        switchMap(() => this.allTradesService.getNewTrades(this.settings!)),
      )
      .subscribe((res) => {
        this.tradesList = [res, ...this.tradesList];
        this.cdr.markForCheck();
      });
  }

  private getTradesListReq(to: number): Observable<AllTradesItem[]> {
    this.isLoading = true;
    return this.allTradesService.getTradesList({
      exchange: this.settings!.exchange,
      symbol: this.settings!.symbol,
      from: toUnixTimestampSeconds(startOfDay(new Date())),
      to,
      take: this.take
    })
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = false;
        })
      );
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
