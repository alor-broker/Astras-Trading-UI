import { Component, input, OnInit, inject } from '@angular/core';
import {Observable, take} from "rxjs";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {DeviceInfo} from "../../../../shared/models/device-info.model";
import {DeviceService} from "../../../../shared/services/device.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {OptionBoardComponent} from '../../components/option-board/option-board.component';
import {OptionBoardSettingsComponent} from '../../components/option-board-settings/option-board-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-option-board-widget',
  templateUrl: './option-board-widget.component.html',
  styleUrls: ['./option-board-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    OptionBoardComponent,
    OptionBoardSettingsComponent,
    AsyncPipe
  ]
})
export class OptionBoardWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly deviceService = inject(DeviceService);

  shouldShowSettings = false;
  deviceInfo$!: Observable<DeviceInfo>;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<OptionBoardSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OptionBoardSettings>(
      this.widgetInstance(),
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
