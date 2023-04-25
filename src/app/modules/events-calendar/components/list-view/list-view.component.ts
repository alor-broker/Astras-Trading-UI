import { Component, OnInit } from '@angular/core';
import { formatCurrency } from "../../../../shared/utils/formatters";
import { CalendarEvents } from "../../models/events-calendar.model";
import { BehaviorSubject } from "rxjs";
import { EventsCalendarService } from "../../services/events-calendar.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.less']
})
export class ListViewComponent implements OnInit {
  events$ = new BehaviorSubject<CalendarEvents>({});

  formatCurrencyFn = formatCurrency;

  constructor(
    private readonly service: EventsCalendarService,
    private readonly dashboardContextService: DashboardContextService,
) {
  }

  ngOnInit() {
    this.service.getEvents()
      .subscribe(e => {
        this.events$.next(e);
      });
  }

  selectInstrument(symbol: string) {
    this.dashboardContextService.selectDashboardInstrument({ symbol, exchange: 'MOEX' }, defaultBadgeColor);
  }
}
