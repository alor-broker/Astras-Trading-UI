import {
  Component, DestroyRef,
  Input,
  OnInit
} from '@angular/core';
import { OrderBook } from "../../models/orderbook.model";
import { OrderbookSettings } from "../../models/orderbook-settings.model";
import {
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { CurrentOrder } from "../../models/orderbook-view-row.model";
import { OrderbookService } from "../../services/orderbook.service";
import { map } from 'rxjs/operators';
import { getTypeByCfi } from '../../../../shared/utils/instruments';
import { InstrumentType } from '../../../../shared/models/enums/instrument-type.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeSettings } from '../../../../shared/models/settings/theme-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  template: '',
})
export abstract class OrderbookTableBaseComponent implements OnInit {
  readonly numberFormats = NumberDisplayFormat;
  @Input({required: true})
  guid!: string;

  @Input()
  ob: OrderBook | null = null;
  settings$!: Observable<OrderbookSettings>;
  shouldShowYield$: Observable<boolean> = of(false);
  private themeSettings?: ThemeSettings;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly modal: ModalService,
    private readonly service: OrderbookService,
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.shouldShowYield$ = this.settings$.pipe(
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

    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => this.themeSettings = s);
  }

  newLimitOrder(event: MouseEvent, price: number, quantity?: number) {
    event.stopPropagation();
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.useOrderWidget) {
        this.widgetsDataProvider.setDataProviderValue<SelectedPriceData>('selectedPrice', {
          price,
          badgeColor: settings.badgeColor!
        });
      }
      else {
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

  updateOrderPrice(order: CurrentOrder, price: number) {
    this.modal.openEditModal({
      type: order.type,
      quantity: order.volume,
      orderId: order.orderId,
      price: price,
      instrument: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      user: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      side: order.side
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
}
