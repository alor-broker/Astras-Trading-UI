import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {OrdersBasketSettings} from '../../models/orders-basket-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {OrdersBasketComponent} from '../../components/orders-basket/orders-basket.component';
import {OrdersBasketSettingsComponent} from '../../components/orders-basket-settings/orders-basket-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orders-basket-widget',
  templateUrl: './orders-basket-widget.component.html',
  styleUrls: ['./orders-basket-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    OrdersBasketComponent,
    OrdersBasketSettingsComponent,
    AsyncPipe
  ]
})
export class OrdersBasketWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<OrdersBasketSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;

  shouldShowSettings = false;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<OrdersBasketSettings>(
      this.widgetInstance(),
      'OrdersBasketSettings',
      settings => ({
        ...settings,
        showPresetsPanel: getValueOrDefault(settings.showPresetsPanel, false),
        presets: getValueOrDefault(settings.presets, [])
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrdersBasketSettings>(this.guid);

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }
}
