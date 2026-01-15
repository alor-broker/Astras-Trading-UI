import {Component, inject, input, OnInit} from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {Observable} from "rxjs";
import {MobileOrderSettings} from "../../models/mobile-order-settings.model";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {AsyncPipe} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TimeframeValue} from "../../../light-chart/models/light-chart.models";
import {MobileOrderContentComponent} from "../../components/mobile-order-content/mobile-order-content.component";

@Component({
  selector: 'ats-mobile-order-widget',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    WidgetSkeletonComponent,
    MobileOrderContentComponent
  ],
  templateUrl: './mobile-order-widget.component.html',
  styleUrl: './mobile-order-widget.component.less',
})
export class MobileOrderWidgetComponent implements OnInit {
  readonly widgetInstance = input.required<WidgetInstance>();

  settings$!: Observable<MobileOrderSettings>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly dashboardContextService = inject(DashboardContextService);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<MobileOrderSettings>(
      this.widgetInstance(),
      'MobileOrderSettings',
      settings => ({
        ...settings,
        chart: {
          ...settings.chart,
          availableTimeFrames: getValueOrDefault(
            settings.chart?.availableTimeFrames,
            [
              TimeframeValue.M1,
              TimeframeValue.M15,
              TimeframeValue.H,
              TimeframeValue.Day,
              TimeframeValue.Month
            ],
          )
        },
        orderbook: {
          ...settings.orderbook,
          depth: getValueOrDefault(settings.orderbook?.depth, 10)
        }
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<MobileOrderSettings>(this.guid);
  }
}
