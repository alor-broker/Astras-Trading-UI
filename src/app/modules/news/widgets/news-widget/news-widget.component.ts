import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { NewsSettings } from '../../models/news-settings.model';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { Observable } from "rxjs";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";

@Component({
  selector: 'ats-news-widget[guid][isBlockWidget]',
  templateUrl: './news-widget.component.html',
  styleUrls: ['./news-widget.component.less']
})
export class NewsWidgetComponent implements OnInit {
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<NewsSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<NewsSettings>(
      this.guid,
      'NewsSettings',
      settings => ({
        ...settings
      }),
      this.dashboardService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
