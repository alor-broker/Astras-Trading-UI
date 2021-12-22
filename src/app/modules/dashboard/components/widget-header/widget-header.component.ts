import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';

@Component({
  selector: 'ats-widget-header[widget]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.sass']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
  private shouldShowSettings = false;

  @Input('widget') set widget(widget: Widget<AnySettings>) { this.widgetSubject.next(widget); };
  private widgetSubject = new BehaviorSubject<Widget<AnySettings> | null>(null);

  widget$ = this.widgetSubject.pipe(
    filter((w) : w is Widget<AnySettings> => !!w)
  );
  private dashboardSub!: Subscription;
  @Output() switchSettingsEvent = new EventEmitter<boolean>();

  constructor(private dashboard: DashboardService) { }

  ngOnInit() {
    this.dashboardSub = this.dashboard.dashboard$.subscribe(w => {
      const found = w.find(w => w.gridItem.label == this.widgetSubject.getValue()?.gridItem.label);
      if (found) {
        this.widgetSubject.next(found);
      }
    })
  }

  ngOnDestroy() {
    this.dashboardSub.unsubscribe();
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
    this.dashboard.removeWidget(item);
  }
}
