import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model
} from '@angular/core';
import { MobileOrderSettings } from "../../models/mobile-order-settings.model";
import {
  LightChartComponent,
  LightChartComponentSettings
} from "../../../light-chart/components/light-chart/light-chart.component";
import { TimeFrameDisplayMode } from "../../../light-chart/models/light-chart-settings.model";
import { TimeframeValue } from "../../../light-chart/models/light-chart.models";
import { ArrayHelper } from "../../../../shared/utils/array-helper";
import {
  OrderBookComponent,
  OrderbookComponentSettings
} from "../../../orderbook/components/orderbook/orderbook.component";
import { NumberDisplayFormat } from "../../../../shared/models/enums/number-display-format";
import { ColumnsOrder } from "../../../orderbook/models/orderbook-settings.model";
import { OrderbookService } from "../../../orderbook/services/orderbook.service";
import { InstrumentQuotesComponent } from "../instrument-quotes/instrument-quotes.component";
import { PullUpPanelComponent } from "../../../../shared/components/pull-up-panel/pull-up-panel.component";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { SubmitOrderFormComponent } from "../submit-order-form/submit-order-form.component";
import { Side } from "../../../../shared/models/enums/side.model";
import { BuySellButtonsComponent } from "../../../order-commands/components/buy-sell-buttons/buy-sell-buttons.component";

@Component({
  selector: 'ats-mobile-order-content',
  imports: [
    LightChartComponent,
    OrderBookComponent,
    InstrumentQuotesComponent,
    PullUpPanelComponent,
    NzIconDirective,
    SubmitOrderFormComponent,
    BuySellButtonsComponent
  ],
  templateUrl: './mobile-order-content.component.html',
  styleUrl: './mobile-order-content.component.less',
  providers: [OrderbookService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileOrderContentComponent {
  readonly settings = input.required<MobileOrderSettings>();

  protected readonly chartSettings = computed(() => {
    const settings = this.settings();
    return {
      targetInstrument: {
        symbol: settings.symbol,
        exchange: settings.exchange,
        instrumentGroup: settings.instrumentGroup,
      },
      chart: {
        availableTimeFrames: settings.chart.availableTimeFrames,
        timeFrameDisplayMode: TimeFrameDisplayMode.Buttons,
      }
    } satisfies LightChartComponentSettings;
  });

  protected readonly orderbookSettings = computed(() => {
    const settings = this.settings();
    return {
      targetInstrument: {
        symbol: settings.symbol,
        exchange: settings.exchange,
        instrumentGroup: settings.instrumentGroup,
      },
      display: {
        depth: settings.orderbook.depth,
        showPriceWithZeroPadding: true,
        showYieldForBonds: true,
        showTable: true,
        showChart: false,
        showVolume: false,
        showSpread: false,
        columnsOrder: ColumnsOrder.VolumesAtTheEdges,
        volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
      }
    } satisfies OrderbookComponentSettings;
  });

  protected readonly defaultTimeframe = computed(() => {
    const settings = this.settings();
    if (settings.chart.availableTimeFrames != null) {
      if (settings.chart.availableTimeFrames.includes(TimeframeValue.Day)) {
        return TimeframeValue.Day;
      }

      return ArrayHelper.lastOrNull(settings.chart.availableTimeFrames) ?? TimeframeValue.Day;
    }

    return TimeframeValue.Day;
  });

  protected readonly orderFormSide = model<Side>(Side.Buy);

  protected readonly orderFormType = model<'limit' | 'market'>('market');

  protected readonly orderFormsVisible = model<boolean>(false);

  protected readonly orderFormsPrice = model<number>(0);

  constructor() {
    effect(() => {
      this.settings();
      this.orderFormType.set('market');
      this.orderFormSide.set(Side.Buy);
    });
  }

  protected openLimitForm(price: number, side: Side): void {
    this.orderFormType.set('limit');
    this.orderFormSide.set(side);
    this.orderFormsPrice.set(price);
    this.orderFormsVisible.set(true);
  }

  protected openMarketForm(side: Side): void {
    this.orderFormType.set('market');
    this.orderFormSide.set(side);
    this.orderFormsVisible.set(true);
  }

  protected readonly Side = Side;
}
