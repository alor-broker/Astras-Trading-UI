import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { InfoSettings } from "../../../info/models/info-settings.model";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { InstrumentsCorrelationSettings } from "../../models/instruments-correlation-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-instruments-correlation-widget',
  templateUrl: './instruments-correlation-widget.component.html',
  styleUrls: ['./instruments-correlation-widget.component.less']
})
export class InstrumentsCorrelationWidgetComponent implements OnInit {
  @Input({ required: true })
  widgetInstance!: WidgetInstance;
  @Input({ required: true })
  isBlockWidget!: boolean;

  settings$!: Observable<InstrumentsCorrelationSettings>;

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InstrumentsCorrelationSettings>(
      this.widgetInstance,
      'InstrumentsCorrelationSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InfoSettings>(this.guid);
  }


}
