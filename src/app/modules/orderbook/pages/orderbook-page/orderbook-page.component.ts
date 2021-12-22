import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardService } from 'src/app/modules/dashboard/services/dashboard.service';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { OrderbookSettings } from '../../models/orderbook-settings.model';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-page[shouldShowSettings][widget][resize]',
  templateUrl: './orderbook-page.component.html',
  styleUrls: ['./orderbook-page.component.sass'],
  providers: [OrderbookService]
})
export class OrderbookPageComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()
  settings$!: Observable<OrderbookSettings>;

  constructor(private service: OrderbookService, private dashboard: DashboardService) { }

  ngOnInit(): void {
    if (this.isOrderbookSettings(this.widget.settings)) {
      this.service.setSettings(this.widget.settings);
    }
    this.settings$ = this.service.settings$;
  }

  onSettingsChange(settings: OrderbookSettings) {
    this.service.setSettings(settings);
    this.widget.settings = settings;
    this.dashboard.updateWidget(this.widget)
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  private isOrderbookSettings(options: object): options is OrderbookSettings   {
    return (
      options != null &&
      "symbol" in options &&
      "exchange" in options
    )
  }
}
