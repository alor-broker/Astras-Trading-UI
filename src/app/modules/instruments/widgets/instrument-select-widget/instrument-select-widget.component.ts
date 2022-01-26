import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { InstrumentsService } from '../../services/instruments.service';

@Component({
  selector: 'ats-instrument-select-widget',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less']
})
export class InstrumentSelectWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<InstrumentSelectSettings>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<InstrumentSelectSettings>;

  constructor(private service: InstrumentsService, private dashboard: DashboardService) { }

  ngOnInit(): void {
    this.service.setSettings(this.widget.settings);
    this.settings$ = this.service.settings$.pipe(
      filter((s): s is InstrumentSelectSettings => !!s )
    );
  }

  onSettingsChange(settings: InstrumentSelectSettings) {
    this.service.setSettings(settings);
    this.widget.settings = settings;
    this.dashboard.updateWidget(this.widget)
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
