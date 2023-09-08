import {Component, DestroyRef, Input, OnInit} from '@angular/core';
import {OrderBook} from "../../models/orderbook.model";
import {OrderbookSettings} from "../../models/orderbook-settings.model";
import {filter, Observable, of, shareReplay, take} from "rxjs";
import {SelectedPriceData} from "../../../../shared/models/orders/selected-order-price.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetsDataProviderService} from "../../../../shared/services/widgets-data-provider.service";
import {CurrentOrder} from "../../models/orderbook-view-row.model";
import {OrderbookService} from "../../services/orderbook.service";
import {map} from 'rxjs/operators';
import {getTypeByCfi, toInstrumentKey} from '../../../../shared/utils/instruments';
import {InstrumentType} from '../../../../shared/models/enums/instrument-type.model';
import {InstrumentsService} from '../../../instruments/services/instruments.service';
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {ThemeService} from '../../../../shared/services/theme.service';
import {ThemeSettings} from '../../../../shared/models/settings/theme-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderType} from "../../../../shared/models/orders/orders-dialog.model";

interface ExtendedOrderbookSettings {
  widgetSettings: OrderbookSettings;
  instrument: Instrument;
}

@Component({
  template: '',
})
export abstract class OrderbookTableBaseComponent implements OnInit {
  readonly numberFormats = NumberDisplayFormat;
  @Input({required: true})
  guid!: string;

  @Input()
  ob: OrderBook | null = null;
  settings$!: Observable<ExtendedOrderbookSettings>;
  shouldShowYield$: Observable<boolean> = of(false);
  private themeSettings?: ThemeSettings;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly service: OrderbookService,
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      mapWith(
        settings => this.instrumentsService.getInstrument(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ExtendedOrderbookSettings)
      ),
      filter(x => !!x.instrument),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.shouldShowYield$ = this.settings$.pipe(
      map(settings => {
        return settings.widgetSettings.showYieldForBonds && getTypeByCfi(settings.instrument.cfiCode) === InstrumentType.Bond;
      }),
      shareReplay()
    );

    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => this.themeSettings = s);
  }

  newLimitOrder(event: MouseEvent, price: number, quantity?: number) {
    event.stopPropagation();
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.widgetSettings.useOrderWidget) {
        this.widgetsDataProvider.setDataProviderValue<SelectedPriceData>('selectedPrice', {
          price,
          badgeColor: settings.widgetSettings.badgeColor!
        });
      }
      else {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings.widgetSettings),
          initialValues: {
            orderType:OrderType.Limit,
            price,
            quantity: quantity ?? 1
          }
        });
      }
    });
  }

  updateOrderPrice(order: CurrentOrder, price: number) {
    if(order.type !== 'limit' && order.type !== 'stop' &&  order.type !== 'stoplimit') {
      return;
    }

    this.ordersDialogService.openEditOrderDialog({
      instrumentKey: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      portfolioKey: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      orderId: order.orderId,
      orderType: order.type === 'limit' ? OrderType.Limit : OrderType.Stop,
      initialValues: {
        quantity: order.volume,
        price
      }
    });
  }

  cancelOrder(event: MouseEvent, orders: CurrentOrder[]) {
    event.stopPropagation();
    for (const order of orders) {
      this.service.cancelOrder(order);
    }
  }

  getBidStyle(value: number) {
    if (!this.themeSettings || !this.ob) {
      return null;
    }

    const size = 100 * (value / this.ob.maxVolume);
    return {
      background: `linear-gradient(270deg, ${this.themeSettings.themeColors.buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
    };
  }

  getAskStyle(value: number) {
    if (!this.themeSettings || !this.ob) {
      return null;
    }

    const size = 100 * (value / this.ob.maxVolume);
    return {
      background: `linear-gradient(90deg, ${this.themeSettings.themeColors.sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
    };
  }

  getTrackKey(index: number): number {
    return index;
  }

  getPriceDecimalSymbolsCount(settings: ExtendedOrderbookSettings): number | null {
    return settings.widgetSettings.showPriceWithZeroPadding === true
      ? MathHelper.getPrecision(settings.instrument.minstep)
      : null;
  }
}
