import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {OrderbookService} from '../services/orderbook.service';
import {AsyncPipe} from '@angular/common';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  ColumnsOrder,
  OrderbookWidgetSettings
} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {WidgetSkeleton} from '../../../common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '../../../common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '../../../common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {
  map,
  Observable,
  take
} from 'rxjs';
import {OrderbookDisplaySettings} from '@terminal-widgets-lib/widgets/orderbook/types/orderbook.types';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {WidgetSharedDataService} from '@terminal-core-lib/features/widgets-communication/services/widget-shared-data.service';
import {SelectedPriceData} from '@terminal-core-lib/features/widgets-communication/services/widget-shared-data-service.types';
import {OrderbookSettings} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook-settings/orderbook-settings';
import {OrderBookComponent} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook/orderbook';

@Component({
  selector: 'ats-orderbook-widget',
  templateUrl: './orderbook-widget.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [OrderbookService],
  imports: [
    TranslocoDirective,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    AsyncPipe,
    OrderbookSettings,
    OrderBookComponent
  ]
})
export class OrderbookWidget extends WidgetBase<OrderbookWidgetSettings> {
  protected readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected readonly ordersDialogService = inject(OrdersDialogService);

  protected orderbookDisplaySettings$!: Observable<OrderbookDisplaySettings>;

  private readonly widgetsSharedDataService = inject(WidgetSharedDataService);

  override ngOnInit(): void {
    super.ngOnInit();

    this.orderbookDisplaySettings$ = this.settings$.pipe(
      map(s => {
        return {
          targetInstrument: {
            symbol: s.symbol,
            exchange: s.exchange,
            instrumentGroup: s.instrumentGroup,
            isin: s.isin
          },
          display: {
            depth: s.depth,
            showChart: s.showChart,
            showTable: s.showTable,
            showYieldForBonds: s.showYieldForBonds,
            showVolume: s.showVolume,
            columnsOrder: s.columnsOrder,
            volumeDisplayFormat: s.volumeDisplayFormat,
            showPriceWithZeroPadding: s.showPriceWithZeroPadding
          }
        };
      })
    );
  }

  createOrder(price: number): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (this.ordersDialogService.dialogOptions.isNewOrderDialogSupported && !(settings.useOrderWidget ?? false)) {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: InstrumentKeyHelper.toInstrumentKey(settings),
          initialValues: {
            orderType: OrderFormType.Limit,
            price,
            quantity: 1
          }
        });

        return;
      }

      this.widgetsSharedDataService.setDataProviderValue<SelectedPriceData>('selectedPrice', {
        price,
        badgeColor: settings.badgeColor ?? DefaultBadge
      });
    });
  }

  protected createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderbookWidgetSettings>(
      this.widgetInstance(),
      'OrderbookSettings',
      settings => ({
        ...settings,
        depth: ValueHelper.getValueOrDefault(settings.depth, 17),
        showChart: ValueHelper.getValueOrDefault(settings.showChart, true),
        showTable: ValueHelper.getValueOrDefault(settings.showTable, true),
        showYieldForBonds: ValueHelper.getValueOrDefault(settings.showYieldForBonds, false),
        useOrderWidget: ValueHelper.getValueOrDefault(settings.useOrderWidget, false),
        showVolume: ValueHelper.getValueOrDefault(settings.showVolume, false),
        columnsOrder: ValueHelper.getValueOrDefault(settings.columnsOrder, ColumnsOrder.VolumesAtTheEdges),
        volumeDisplayFormat: ValueHelper.getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showPriceWithZeroPadding: ValueHelper.getValueOrDefault(settings.showPriceWithZeroPadding, true)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
