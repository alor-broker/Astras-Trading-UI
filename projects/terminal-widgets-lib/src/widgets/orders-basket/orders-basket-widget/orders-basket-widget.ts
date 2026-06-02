import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {OrdersBasketWidgetSettings} from '@terminal-widgets-lib/widgets/orders-basket/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {
  map,
  Observable
} from 'rxjs';
import {startWith} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {OrdersBasket} from '@terminal-widgets-lib/widgets/orders-basket/components/orders-basket/orders-basket';
import {OrdersBasketSettings} from '@terminal-widgets-lib/widgets/orders-basket/components/orders-basket-settings/orders-basket-settings';

@Component({
  selector: 'ats-orders-basket-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    OrdersBasket,
    OrdersBasketSettings
  ],
  templateUrl: './orders-basket-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersBasketWidget extends WidgetBase<OrdersBasketWidgetSettings> {
  title$!: Observable<string>;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  override ngOnInit(): void {
    super.ngOnInit();
    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`),
      startWith('')
    );
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<OrdersBasketWidgetSettings>(
      this.widgetInstance(),
      'OrdersBasketSettings',
      settings => ({
        ...settings,
        showPresetsPanel: ValueHelper.getValueOrDefault(settings.showPresetsPanel, false),
        presets: ValueHelper.getValueOrDefault(settings.presets, [])
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
