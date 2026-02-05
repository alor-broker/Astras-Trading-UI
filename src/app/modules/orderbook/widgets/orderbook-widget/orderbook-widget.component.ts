import {Component, inject, input, OnInit} from '@angular/core';
import {OrderbookService} from '../../services/orderbook.service';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {Observable, shareReplay, take} from 'rxjs';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {ColumnsOrder, OrderbookSettings} from '../../models/orderbook-settings.model';
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {OrderBookComponent, OrderbookComponentSettings} from '../../components/orderbook/orderbook.component';
import {OrderbookSettingsComponent} from '../../components/orderbook-settings/orderbook-settings.component';
import {AsyncPipe} from '@angular/common';
import {map} from "rxjs/operators";
import {WidgetsSharedDataService} from "../../../../shared/services/widgets-shared-data.service";
import {SelectedPriceData} from "../../../../shared/models/orders/selected-order-price.model";
import {defaultBadgeColor, toInstrumentKey} from "../../../../shared/utils/instruments";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";

@Component({
  selector: 'ats-orderbook-widget',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.less'],
  providers: [OrderbookService],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    OrderBookComponent,
    OrderbookSettingsComponent,
    AsyncPipe
  ]
})
export class OrderbookWidgetComponent implements OnInit {
  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  widgetSettings!: Observable<OrderbookSettings>;

  orderbookSettings!: Observable<OrderbookComponentSettings>;

  showBadge$!: Observable<boolean>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly dashboardContextService = inject(DashboardContextService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly widgetsSharedDataService = inject(WidgetsSharedDataService);

  private readonly ordersDialogService = inject(OrdersDialogService);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderbookSettings>(
      this.widgetInstance(),
      'OrderbookSettings',
      settings => ({
        ...settings,
        depth: getValueOrDefault(settings.depth, 17),
        showChart: getValueOrDefault(settings.showChart, true),
        showTable: getValueOrDefault(settings.showTable, true),
        showYieldForBonds: getValueOrDefault(settings.showYieldForBonds, false),
        useOrderWidget: getValueOrDefault(settings.useOrderWidget, false),
        showVolume: getValueOrDefault(settings.showVolume, false),
        columnsOrder: getValueOrDefault(settings.columnsOrder, ColumnsOrder.VolumesAtTheEdges),
        volumeDisplayFormat: getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showPriceWithZeroPadding: getValueOrDefault(settings.showPriceWithZeroPadding, true),
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.widgetSettings = this.widgetSettingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      shareReplay(1),
    );

    this.orderbookSettings = this.widgetSettings.pipe(
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
        } satisfies OrderbookComponentSettings;
      })
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  createOrder(price: number): void {
    this.widgetSettings.pipe(
      take(1)
    ).subscribe(settings => {
      if(this.ordersDialogService.dialogOptions.isNewOrderDialogSupported && !(settings.useOrderWidget ?? false)) {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings),
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
        badgeColor: settings.badgeColor ?? defaultBadgeColor
      });
    });
  }
}
