import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { OrdersBasketSettings } from '../../models/orders-basket-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-orders-basket-widget',
  templateUrl: './orders-basket-widget.component.html',
  styleUrls: ['./orders-basket-widget.component.less']
})
export class OrdersBasketWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<OrdersBasketSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;

  shouldShowSettings = false;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<OrdersBasketSettings>(
      this.widgetInstance,
      'OrdersBasketSettings',
      settings => ({
        ...settings,
        showPresetsPanel: getValueOrDefault(settings.showPresetsPanel, false),
        presets: getValueOrDefault(settings.presets, [])
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.dashboardContextService.selectedPortfolio$.pipe(
      switchMap(() => this.widgetSettingsService.getSettings<OrdersBasketSettings>(this.guid))
    );

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }
}
