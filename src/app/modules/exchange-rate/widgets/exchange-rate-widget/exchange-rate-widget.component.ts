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


@Component({
  selector: 'ats-exchange-rate-widget[guid][isBlockWidget]',
  templateUrl: './exchange-rate-widget.component.html',
  styleUrls: ['./exchange-rate-widget.component.less']
})
export class ExchangeRateWidgetComponent implements OnInit {
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ExchangeRateSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ExchangeRateSettings>(
      this.guid,
      'ExchangeRateSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ExchangeRateSettings>(this.guid);
  }
}
