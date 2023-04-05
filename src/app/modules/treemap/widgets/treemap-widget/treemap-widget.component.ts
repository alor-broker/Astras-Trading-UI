import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { TreemapSettings } from "../../models/treemap.model";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { Observable } from "rxjs";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-treemap-widget[guid]',
  templateUrl: './treemap-widget.component.html',
  styleUrls: ['./treemap-widget.component.less']
})
export class TreemapWidgetComponent implements OnInit {
  @Input() guid!: string;
  @Input() isBlockWidget!: boolean;

  settings$!: Observable<TreemapSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<TreemapSettings>(
      this.guid,
      'TreemapSettings',
      settings => ({
        ...settings,
        badgeColor: defaultBadgeColor
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TreemapSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
