import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'ats-widget-header',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.sass']
})
export class WidgetHeaderComponent implements OnInit {
  private shouldShowSettings = false;

  @Input() widget!: Widget;

  @Output() switchSettingsEvent = new EventEmitter<boolean>();

  constructor(private service: DashboardService) { }

  ngOnInit() {
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings)
  }

  removeItem($event: MouseEvent | TouchEvent, item : any): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.service.removeWidget(item);
  }
}
