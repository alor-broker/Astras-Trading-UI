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


@Component({
  selector: 'ats-exchange-rate-widget[widgetInstance][isBlockWidget]',
  templateUrl: './exchange-rate-widget.component.html',
  styleUrls: ['./exchange-rate-widget.component.less']
})
export class ExchangeRateWidgetComponent implements OnInit {
  @Input()
  widgetInstance!: WidgetInstance;

  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ExchangeRateSettings>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
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
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ExchangeRateSettings>(this.guid);
  }
}
