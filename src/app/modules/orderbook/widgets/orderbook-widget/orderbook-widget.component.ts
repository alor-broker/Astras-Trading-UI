import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { OrderbookSettings } from '../../../../shared/models/settings/orderbook-settings.model';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-widget[shouldShowSettings][widget][resize][linkedToActive]',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.less'],
  providers: [OrderbookService]
})
export class OrderbookWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input('linkedToActive') set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  widget!: Widget<OrderbookSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()

  constructor(private service: OrderbookService) { }

  ngOnInit(): void {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
