import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { TreemapSettings } from "../../models/treemap.model";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { Observable } from "rxjs";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-treemap-widget',
  templateUrl: './treemap-widget.component.html',
  styleUrls: ['./treemap-widget.component.less']
})
export class TreemapWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<TreemapSettings>;
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
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<TreemapSettings>(
      this.widgetInstance,
      'TreemapSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        refreshIntervalSec: getValueOrDefault(settings.refreshIntervalSec, 60)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TreemapSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
