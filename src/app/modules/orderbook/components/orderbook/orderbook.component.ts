import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import {
  ChartData,
  OrderBook
} from '../../models/orderbook.model';
import {
  map,
  startWith,
  tap
} from 'rxjs/operators';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderbookSettings } from "../../../../shared/models/settings/orderbook-settings.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeSettings } from '../../../../shared/models/settings/theme-settings.model';

interface Size {
  width: string;
  height: string;
}

@Component({
  selector: 'ats-order-book[guid][resize][shouldShowSettings]',
  templateUrl: './orderbook.component.html',
  styleUrls: ['./orderbook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  shouldShowYield$: Observable<boolean> = of(false);
  shouldShowTable$: Observable<boolean> = of(true);
  ob$: Observable<OrderBook | null> = of(null);
  maxVolume: number = 1;
  themeSettings?: ThemeSettings;

  sizes: BehaviorSubject<Size> = new BehaviorSubject<Size>({
    width: '100%',
    height: '100%',
  });
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly service: OrderbookService,
    private readonly modal: ModalService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly themeService: ThemeService) {
  }

  ngOnInit(): void {
    const settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay()
    );

    this.shouldShowTable$ = settings$.pipe(
      map((s) => s.showTable)
    );

    this.shouldShowYield$ = settings$.pipe(
      switchMap(settings => {
        if (!settings.showYieldForBonds) {
          return of(false);
        }

        return this.instrumentsService.getInstrument({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        }).pipe(
          map(x => !!x && getTypeByCfi(x.cfiCode) === InstrumentType.Bond)
        );
      }),
      shareReplay()
    );

    this.ob$ = combineLatest([settings$, this.themeService.getThemeSettings()]).pipe(
      tap(([,theme]) => { this.themeSettings = theme;}),
      switchMap(([settings,]) => this.service.getOrderBook(settings)),
      tap((ob) => (this.maxVolume = ob?.maxVolume ?? 1)),
      startWith(<OrderBook>{
        rows: [],
        maxVolume: 1,
        chartData: <ChartData>{
          asks: [],
          bids: [],
          minPrice: 0,
          maxPrice: 0
        }
      }
    ));

    this.widgetsDataProvider.addNewDataProvider<SelectedPriceData>('selectedPrice');
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getBidStyle(value: number) {
    if(!this.themeSettings) {
      return null;
    }

    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(270deg, ${this.themeSettings.themeColors.buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
    };
  }

  getAskStyle(value: number) {
    if(!this.themeSettings) {
      return null;
    }

    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(90deg, ${this.themeSettings.themeColors.sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
    };
  }

  cancelOrder(event: MouseEvent, cancells: CancelCommand[]) {
    event.stopPropagation();
    for (const cancel of cancells) {
      this.service.cancelOrder(cancel);
    }
  }

  newLimitOrder(event: MouseEvent, price: number, quantity?: number) {
    event.stopPropagation();
    this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.useOrderWidget) {
        this.widgetsDataProvider.setDataProviderValue<SelectedPriceData>('selectedPrice',{price, badgeColor: settings.badgeColor!});
      } else {
        const params: CommandParams = {
          instrument: { ...settings },
          price,
          quantity: quantity ?? 1,
          type: CommandType.Limit,
        };
        this.modal.openCommandModal(params);
      }
    });
  }

  getTrackKey(index: number): number {
    return index;
  }
}
