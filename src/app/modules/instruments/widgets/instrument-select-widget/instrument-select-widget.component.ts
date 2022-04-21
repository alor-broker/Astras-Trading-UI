import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { InstrumentsService } from '../../services/instruments.service';

@Component({
  selector: 'ats-instrument-select-widget[guid]',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less']
})
export class InstrumentSelectWidgetComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<InstrumentSelectSettings>;

  constructor() { }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
