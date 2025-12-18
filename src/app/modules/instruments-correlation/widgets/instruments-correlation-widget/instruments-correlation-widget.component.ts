import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { InstrumentsCorrelationSettings } from "../../models/instruments-correlation-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { CorrelationChartComponent } from '../../components/correlation-chart/correlation-chart.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-instruments-correlation-widget',
    templateUrl: './instruments-correlation-widget.component.html',
    styleUrls: ['./instruments-correlation-widget.component.less'],
    imports: [
      WidgetSkeletonComponent,
      WidgetHeaderComponent,
      CorrelationChartComponent,
      AsyncPipe
    ]
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

    this.settings$ = this.widgetSettingsService.getSettings<InstrumentsCorrelationSettings>(this.guid);
  }
}
