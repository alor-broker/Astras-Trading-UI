import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { map } from "rxjs/operators";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";

@Component({
  selector: 'ats-mobile-instruments-history',
  templateUrl: './mobile-instruments-history.component.html',
  styleUrls: ['./mobile-instruments-history.component.less']
})
export class MobileInstrumentsHistoryComponent implements OnInit {
  instruments$!: Observable<InstrumentKey[]>;
  selectedInstrument$!: Observable<InstrumentKey | null | undefined>;

  constructor(
    private readonly mobileDashboardService: MobileDashboardService,
    private readonly dashboardContextService: DashboardContextService
  ) {
  }

  ngOnInit() {
    this.instruments$ = this.mobileDashboardService.instruments$;
    this.selectedInstrument$ = this.dashboardContextService.instrumentsSelection$
      .pipe(
        map(d => d.yellow)
      );
  }

  selectInstrument(instrument: InstrumentKey) {
    this.dashboardContextService.selectMobileDashboardInstrument(instrument, 'yellow');
  }

  isInstrumentEqual(i1: InstrumentKey, i2: InstrumentKey) {
    return isInstrumentEqual(i1, i2);
  }
}
