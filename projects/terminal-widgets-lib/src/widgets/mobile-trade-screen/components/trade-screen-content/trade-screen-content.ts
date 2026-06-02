import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {MobileTradeScreenWidgetSettings} from '@terminal-widgets-lib/widgets/mobile-trade-screen/widget-settings.types';
import {TimeFrameDisplayMode} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {
  LightChartComponent,
  LightChartDisplaySettings
} from '@terminal-widgets-lib/widgets/light-chart/components/light-chart/light-chart';
import {ColumnsOrder} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {OrderbookDisplaySettings} from '@terminal-widgets-lib/widgets/orderbook/types/orderbook.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {InstrumentQuotes} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/instrument-quotes/instrument-quotes';
import {OrderBookComponent} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook/orderbook';
import {InstrumentInfo} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/instrument-info/instrument-info';
import {TradeScreenSubmitOrderForm} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/trade-screen-submit-order-form/trade-screen-submit-order-form';
import {BuySellButtons} from '@terminal-widgets-lib/widgets/order-commands/components/buy-sell-buttons/buy-sell-buttons';
import {PullUpPanel} from '@terminal-core-lib/common/components/pull-up-panel/pull-up-panel';
import {LightChartDatafeedFactoryService} from '@terminal-widgets-lib/widgets/light-chart/services/light-chart-datafeed-factory.service';

@Component({
  selector: 'ats-trade-screen-content',
  imports: [
    NzIconDirective,
    InstrumentQuotes,
    LightChartComponent,
    OrderBookComponent,
    InstrumentInfo,
    TradeScreenSubmitOrderForm,
    BuySellButtons,
    PullUpPanel,
  ],
  templateUrl: './trade-screen-content.html',
  styleUrl: './trade-screen-content.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [LightChartDatafeedFactoryService]
})
export class TradeScreenContent {
  readonly settings = input.required<MobileTradeScreenWidgetSettings>();

  protected readonly contentRoot = viewChild<ElementRef<HTMLElement>>('contentRoot');

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
    } satisfies LightChartDisplaySettings;
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
    } satisfies OrderbookDisplaySettings;
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

  protected readonly Side = Side;

  constructor() {
    effect(() => {
      this.settings();
      this.orderFormType.set('market');
      this.orderFormSide.set(Side.Buy);

      this.contentRoot()?.nativeElement.scrollTo(0, 0);
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
}
