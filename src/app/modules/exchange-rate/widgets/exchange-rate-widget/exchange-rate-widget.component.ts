import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { Observable } from 'rxjs';
import { ExchangeRateSettings } from '../../models/exchange-rate-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";


@Component({
  selector: 'ats-exchange-rate-widget',
  templateUrl: './exchange-rate-widget.component.html',
  styleUrls: ['./exchange-rate-widget.component.less']
})
export class ExchangeRateWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ExchangeRateSettings>;
  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ExchangeRateSettings>(
      this.widgetInstance,
      'ExchangeRateSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ExchangeRateSettings>(this.guid);

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
