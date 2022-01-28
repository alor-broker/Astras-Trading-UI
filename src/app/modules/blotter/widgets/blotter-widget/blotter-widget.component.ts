import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][linkedToActive]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less']
})
export class BlotterWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input('linkedToActive') set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  guid!: string

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()

  constructor(private service: BlotterService) { }

  ngOnInit(): void {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
