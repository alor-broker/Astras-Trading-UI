import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  LineMarkerPosition,
  TechChartWidgetSettings,
  TradeDisplayMarker
} from '@terminal-widgets-lib/widgets/tech-chart/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {
  Observable,
  take
} from 'rxjs';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {TechChart} from '@terminal-widgets-lib/widgets/tech-chart/components/tech-chart/tech-chart';
import {TechChartSettings} from '@terminal-widgets-lib/widgets/tech-chart/components/tech-chart-settings/tech-chart-settings';
import {SyntheticInstrumentsHelper} from '@terminal-widgets-lib/widgets/tech-chart/utils/synthetic-instruments.helper';
import {map} from 'rxjs/operators';

@Component({
  selector: 'ats-tech-chart-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    TechChart,
    TechChartSettings
  ],
  templateUrl: './tech-chart-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechChartWidget extends WidgetBase<TechChartWidgetSettings> {
  headerTitle$!: Observable<string | null>;

  private readonly themeService = inject(ThemeService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  override ngOnInit(): void {
    super.ngOnInit();

    this.headerTitle$ = this.settings$.pipe(
      map(s => SyntheticInstrumentsHelper.isSyntheticInstrument(s.symbol) ? s.symbol : null)
    );
  }

  protected override createSettingsIfMissing(): void {
    this.themeService.getThemeSettings().pipe(
      take(1)
    ).subscribe(theme => {
      WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<TechChartWidgetSettings & InstrumentKey>(
        this.widgetInstance(),
        'TechChartSettings',
        settings => ({
          ...settings,
          showTrades: ValueHelper.getValueOrDefault(settings.showTrades, false),
          showOrders: ValueHelper.getValueOrDefault(settings.showOrders, true),
          ordersLineMarkerPosition: ValueHelper.getValueOrDefault(settings.ordersLineMarkerPosition, LineMarkerPosition.Middle),
          showPosition: ValueHelper.getValueOrDefault(settings.showPosition, true),
          positionLineMarkerPosition: ValueHelper.getValueOrDefault(settings.positionLineMarkerPosition, LineMarkerPosition.Middle),
          panels: ValueHelper.getValueOrDefault(
            settings.panels,
            {
              timeframesBottomToolbar: true,
              drawingsToolbar: true,
              header: true,
              headerSymbolSearch: true,
              headerChartType: true,
              headerCompare: true,
              headerResolutions: true,
              headerIndicators: true,
              headerScreenshot: true,
              headerSettings: true,
              headerUndoRedo: true,
              headerFullscreenButton: true
            }
          ),
          trades: ValueHelper.getValueOrDefault(
            settings.trades,
            {
              marker: TradeDisplayMarker.Note,
              buyTradeColor: theme.themeColors.buyColorAccent,
              sellTradeColor: theme.themeColors.sellColorAccent,
              markerSize: 20
            }
          ),
          orders: {
            editWithoutConfirmation: false
          }
        }),
        this.dashboardContextService,
        this.widgetSettingsService
      );
    });
  }
}
