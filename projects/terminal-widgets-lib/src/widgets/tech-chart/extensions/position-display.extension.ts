import {
  BaseExtension,
  ChartContext
} from "./base.extension";
import {
  inject,
  Injectable
} from "@angular/core";
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  Subscription,
  switchMap,
  TeardownLogic
} from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import {IPositionLineAdapter} from '@terminal-widgets-lib/assets/charting_library';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  LineMarkerPosition,
  TechChartWidgetSettings
} from '@terminal-widgets-lib/widgets/tech-chart/widget-settings.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';

class PositionState {
  positionLine: IPositionLineAdapter | null = null;

  private readonly tearDown = new Subscription();

  constructor() {
    this.tearDown.add(() => this.clear());
  }

  onDestroy(teardown: TeardownLogic): void {
    this.tearDown.add(teardown);
  }

  destroy(): void {
    this.tearDown.unsubscribe();
  }

  clear(): void {
    try {
      this.positionLine?.remove();
      this.positionLine = null;
    } catch { /* empty */
    }
  }
}

@Injectable()
export class PositionDisplayExtension extends BaseExtension {
  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly translatorService = inject(TranslatorService);

  private positionState: PositionState | null = null;

  apply(context: ChartContext): void {
    this.positionState?.destroy();

    if (!(context.settings.showPosition ?? true)) {
      return;
    }

    this.positionState = new PositionState();

    this.positionState.onDestroy(this.drawPosition(context));
  }

  update(context: ChartContext): void {
    this.apply(context);
  }

  destroyState(): void {
    this.positionState?.destroy();
  }

  private drawPosition(context: ChartContext): TeardownLogic {
    return combineLatest({
      position: this.getCurrentPosition(context.settings),
      translator: this.translatorService.getTranslator('tech-chart/tech-chart')
    }).subscribe(x => {
      const positionState = this.positionState!;
      if (!x.position) {
        positionState.clear();
        return;
      }

      if (positionState.positionLine == null) {
        try {
          positionState.positionLine = this.getChartApi(context)
            .createPositionLine()
            .setText(x.translator(['position']));
        } catch {
          return;
        }
      }

      const themeColors = context.theme.themeColors;
      const color = x.position.qtyTFutureBatch >= 0
        ? themeColors.buyColor
        : themeColors.sellColor;

      const backgroundColor = x.position.qtyTFutureBatch >= 0
        ? themeColors.buyColorBackground
        : themeColors.sellColorBackground;

      positionState.positionLine
        .setQuantity(x.position.qtyTFutureBatch.toString())
        .setPrice(x.position.avgPrice)
        .setLineColor(color)
        .setBodyBackgroundColor(themeColors.componentBackground)
        .setBodyBorderColor(color)
        .setQuantityBackgroundColor(color)
        .setQuantityBorderColor(backgroundColor)
        .setQuantityTextColor(themeColors.chartPrimaryTextColor)
        .setBodyTextColor(themeColors.chartPrimaryTextColor)
        .setLineLength(this.getMarkerLineLengthPercent(context.settings.positionLineMarkerPosition), "percentage");
    });
  }

  private getCurrentPosition(settings: TechChartWidgetSettings): Observable<Position | null> {
    return this.currentDashboardService.selectedPortfolio$.pipe(
      switchMap(portfolio => this.portfolioSubscriptionsService.getAllPositionsSubscription(portfolio.portfolio, portfolio.exchange)),
      map(positions => positions.filter(p => p.avgPrice && p.qtyTFutureBatch)),
      startWith([]),
      map(x => x.find(p => p.targetInstrument.symbol === settings.symbol && p.targetInstrument.exchange === settings.exchange) ?? null),
      distinctUntilChanged((p, c) => p?.avgPrice === c?.avgPrice && p?.qtyTFutureBatch === c?.qtyTFutureBatch),
    );
  }

  private getMarkerLineLengthPercent(position: LineMarkerPosition | undefined): number {
    switch (position) {
      case LineMarkerPosition.Left:
        return 90;
      case LineMarkerPosition.Middle:
        return 40;
      default:
        return 10;
    }
  }
}
