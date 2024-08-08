import {Component, Input, OnInit} from '@angular/core';
import { Observable, take } from "rxjs";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { DeviceInfo } from "../../../../shared/models/device-info.model";
import { DeviceService } from "../../../../shared/services/device.service";

@Component({
  selector: 'ats-option-board-widget',
  templateUrl: './option-board-widget.component.html',
  styleUrls: ['./option-board-widget.component.less']
})
export class OptionBoardWidgetComponent implements OnInit {
  shouldShowSettings = false;
  deviceInfo$!: Observable<DeviceInfo>;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<OptionBoardSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly deviceService: DeviceService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OptionBoardSettings>(
      this.widgetInstance,
      'OptionBoardSettings',
      settings => ({
        ...settings
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OptionBoardSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );
  }
}
