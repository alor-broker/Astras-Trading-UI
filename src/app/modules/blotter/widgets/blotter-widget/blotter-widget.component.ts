import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][widget]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.sass']
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {

  @Input()
  shouldShowSettings!: boolean;
  @Input('linkedToActive') set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  widget!: Widget<BlotterSettings>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<BlotterSettings>;

  constructor(private service: BlotterService, private dashboard: DashboardService) { }

  ngOnInit(): void {
    this.service.setSettings(this.widget.settings);
    this.settings$ = this.service.settings$.pipe(
      filter((s): s is BlotterSettings => !!s )
    );
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
  }

  onSettingsChange(settings: BlotterSettings) {
    this.service.setSettings(settings);
    this.widget.settings = settings;
    this.dashboard.updateWidget(this.widget)
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
