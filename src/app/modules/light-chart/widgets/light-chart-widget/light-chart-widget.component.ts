import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {TimeframeValue} from '../../models/light-chart.models';
import {Observable, shareReplay} from 'rxjs';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {LightChartWidgetSettings, TimeFrameDisplayMode} from '../../models/light-chart-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {LightChartComponent, LightChartComponentSettings} from '../../components/light-chart/light-chart.component';
import {LightChartSettingsComponent} from '../../components/light-chart-settings/light-chart-settings.component';
import {AsyncPipe} from '@angular/common';
import {map} from "rxjs/operators";

@Component({
  selector: 'ats-light-chart-widget',
  templateUrl: './light-chart-widget.component.html',
  styleUrls: ['./light-chart-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    LightChartComponent,
    LightChartSettingsComponent,
    AsyncPipe
  ]
})
export class LightChartWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  widgetSettings$!: Observable<LightChartWidgetSettings>;
  chartSettings$!: Observable<LightChartComponentSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<LightChartWidgetSettings>(
      this.widgetInstance(),
      'LightChartSettings',
      settings => ({
        ...settings,
        timeFrame: getValueOrDefault(settings.timeFrame, TimeframeValue.Day),
        timeFrameDisplayMode: getValueOrDefault(settings.timeFrameDisplayMode, TimeFrameDisplayMode.Buttons),
        availableTimeFrames: [TimeframeValue.M1, TimeframeValue.M15, TimeframeValue.H, TimeframeValue.Day],
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.widgetSettings$ = this.widgetSettingsService.getSettings<LightChartWidgetSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.chartSettings$ = this.widgetSettings$.pipe(
      map(s => {
        return {
          targetInstrument: {
            symbol: s.symbol,
            exchange: s.exchange,
            instrumentGroup: s.instrumentGroup
          },
          chart: {
            availableTimeFrames: s.availableTimeFrames,
            timeFrameDisplayMode: s.timeFrameDisplayMode,
          }
        } satisfies LightChartComponentSettings;
      })
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  protected updateSelectedTimeFrame(timeFrame: TimeframeValue): void {
    this.widgetSettingsService.updateSettings<LightChartWidgetSettings>(
      this.guid,
      {
        timeFrame
      }
    );
  }
}
