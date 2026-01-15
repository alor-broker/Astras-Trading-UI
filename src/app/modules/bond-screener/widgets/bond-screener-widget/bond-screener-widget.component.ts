import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {Observable} from "rxjs";
import {InstrumentSelectSettings} from "../../../instruments/models/instrument-select-settings.model";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {bondScreenerColumns, BondScreenerSettings} from "../../models/bond-screener-settings.model";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {NzTabComponent, NzTabsComponent} from 'ng-zorro-antd/tabs';
import {BondScreenerComponent} from '../../components/bond-screener/bond-screener.component';
import {YieldCurveChartComponent} from '../../components/yield-curve-chart/yield-curve-chart.component';
import {BondScreenerSettingsComponent} from '../../components/bond-screener-settings/bond-screener-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-bond-screener-widget',
  templateUrl: './bond-screener-widget.component.html',
  styleUrls: ['./bond-screener-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    NzTabsComponent,
    NzTabComponent,
    BondScreenerComponent,
    YieldCurveChartComponent,
    BondScreenerSettingsComponent,
    AsyncPipe
  ]
})
export class BondScreenerWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<InstrumentSelectSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<BondScreenerSettings>(
      this.widgetInstance(),
      'BondScreenerSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        bondScreenerTable: TableSettingHelper.toTableDisplaySettings(settings.bondScreenerTable, bondScreenerColumns.filter(c => c.isDefault).map(c => c.id))!,
        hideExpired: getValueOrDefault(settings.hideExpired, true)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InstrumentSelectSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
