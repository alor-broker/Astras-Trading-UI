import { Component, Input, OnInit } from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import {
  InstrumentSelectSettings
} from "../../../instruments/models/instrument-select-settings.model";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { BondScreenerSettings, bondScreenerColumns } from "../../models/bond-screener-settings.model";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-bond-screener-widget',
  templateUrl: './bond-screener-widget.component.html',
  styleUrls: ['./bond-screener-widget.component.less']
})
export class BondScreenerWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<InstrumentSelectSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<BondScreenerSettings>(
      this.widgetInstance,
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
