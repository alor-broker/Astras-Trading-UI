import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';

@Component({
  selector: 'ats-light-chart-widget',
  templateUrl: './light-chart-widget.component.html',
  styleUrls: ['./light-chart-widget.component.sass'],
  providers: [LightChartService]
})
export class LightChartWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<LightChartSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<LightChartSettings>;

  constructor(private service: LightChartService, private dashboard: DashboardService) { }

  ngOnInit(): void {
    this.service.setSettings(this.widget.settings);
    this.settings$ = this.service.settings$;
  }

  onSettingsChange(settings: LightChartSettings) {
    this.service.setSettings(settings);
    this.widget.settings = settings;
    this.dashboard.updateWidget(this.widget)
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
