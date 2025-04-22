import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable, switchMap } from "rxjs";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";
import {MobileDashboardService} from "../../../modules/dashboard/services/mobile-dashboard.service";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../modules/instruments/services/instruments.service";
import {filter, map} from "rxjs/operators";
import {defaultBadgeColor} from "../../../shared/utils/instruments";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {TranslocoDirective} from "@jsverse/transloco";
import { isInstrumentEqual } from '../../../shared/utils/settings-helper';

interface InstrumentKeyViewData extends InstrumentKey {
  showInstrumentGroup: boolean;
}

@Component({
    selector: 'ats-mobile-instruments-history',
    templateUrl: './mobile-instruments-history.component.html',
    styleUrls: ['./mobile-instruments-history.component.less'],
    imports: [
        NgIf,
        AsyncPipe,
        NzTagComponent,
        NgForOf,
        TranslocoDirective
    ]
})
export class MobileInstrumentsHistoryComponent implements OnInit {
  instruments$!: Observable<InstrumentKeyViewData[] | undefined>;
  selectedInstrument$!: Observable<InstrumentKey | null | undefined>;

  constructor(
    private readonly mobileDashboardService: MobileDashboardService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly instrumentsService: InstrumentsService
  ) {
  }

  ngOnInit(): void {
    this.instruments$ = this.mobileDashboardService.getInstrumentsHistory()
      .pipe(
        filter(instruments => (instruments ?? []).length > 0),
        switchMap(instruments => {
          return forkJoin(
            instruments!.map(instrument =>
              this.instrumentsService.getInstrument({ exchange: instrument.exchange, symbol: instrument.symbol })
                .pipe(
                  map(instr => ({
                    ...instrument,
                    showInstrumentGroup: instrument.instrumentGroup !== instr?.instrumentGroup
                      || instruments!.filter(i => i.symbol === instrument.symbol).length > 1
                  }))
                )
            )
          );
        })
      );

    this.selectedInstrument$ = this.dashboardContextService.instrumentsSelection$
      .pipe(
        map(d => d[defaultBadgeColor])
      );
  }

  selectInstrument(instrument: InstrumentKey): void {
    this.dashboardContextService.selectDashboardInstrument(instrument, defaultBadgeColor);
  }

  isInstrumentEqual(i1: InstrumentKey, i2: InstrumentKey): boolean {
    return isInstrumentEqual(i1, i2);
  }
}
