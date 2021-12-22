import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-widget[shouldShowSettings][widget][resize]',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.sass'],
  providers: [OrderbookService]
})
export class OrderbookWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<OrderbookSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<OrderbookSettings>;

  constructor(private service: OrderbookService, private dashboard: DashboardService) { }

  ngOnInit(): void {
    this.service.setSettings(this.widget.settings);
    this.settings$ = this.service.settings$.pipe(
      filter((s): s is OrderbookSettings => !!s )
    );
  }

  onSettingsChange(settings: OrderbookSettings) {
    this.service.setSettings(settings);
    this.widget.settings = settings;
    this.dashboard.updateWidget(this.widget)
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
