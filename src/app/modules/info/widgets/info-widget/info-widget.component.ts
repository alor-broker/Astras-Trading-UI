import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Observable } from 'rxjs';
import { ExchangeInfo } from '../../models/exchange-info.model';
import { InfoService } from '../../services/info.service';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { InfoSettings } from '../../models/info-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

@Component({
  selector: 'ats-info-widget',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less'],
  providers: [InfoService]
})
export class InfoWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  @Input()
  isVisible = true;

  settings$!: Observable<InfoSettings>;
  showBadge$!: Observable<boolean>;
  info$?: Observable<ExchangeInfo | null>;

  constructor(
    private readonly service: InfoService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<InfoSettings>(
      this.widgetInstance,
      'InfoSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InfoSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.service.init(this.guid);
    this.info$ = this.service.getExchangeInfo();
  }
}
