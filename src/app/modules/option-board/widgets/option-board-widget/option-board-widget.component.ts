import {Component, Input, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

@Component({
  selector: 'ats-option-board-widget',
  templateUrl: './option-board-widget.component.html',
  styleUrls: ['./option-board-widget.component.less']
})
export class OptionBoardWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<OptionBoardSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange() {
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
  }
}
