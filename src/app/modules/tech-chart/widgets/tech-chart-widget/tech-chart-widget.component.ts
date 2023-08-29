import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { Observable } from 'rxjs';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import { TerminalSettingsService } from 'src/app/shared/services/terminal-settings.service';

@Component({
  selector: 'ats-tech-chart-widget',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less'],
  providers: [TechChartDatafeedService]
})
export class TechChartWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<TechChartSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<TechChartSettings>(
      this.widgetInstance,
      'TechChartSettings',
      settings => ({
        ...settings,
        chartSettings: {}
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TechChartSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
