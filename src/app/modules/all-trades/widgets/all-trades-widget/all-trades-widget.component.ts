import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { Observable } from 'rxjs';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
    selector: 'ats-all-trades-widget',
    templateUrl: './all-trades-widget.component.html',
    styleUrls: ['./all-trades-widget.component.less'],
    standalone: false
})
export class AllTradesWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<AllTradesSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<AllTradesSettings>(
      this.widgetInstance,
      'AllTradesSettings',
      settings => ({
        ...settings,
        allTradesColumns: getValueOrDefault(
          settings.allTradesColumns,
          allTradesWidgetColumns.filter(c => c.isDefault).map(col => col.id)
        ),
        highlightRowsBySide: getValueOrDefault(settings.highlightRowsBySide, false)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllTradesSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
