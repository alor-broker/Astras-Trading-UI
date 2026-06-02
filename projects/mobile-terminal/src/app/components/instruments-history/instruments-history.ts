import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {MobileDashboardManageService} from '../../features/dashboard/services/mobile-dashboard-manage.service';
import {MobileDashboardContextService} from '../../features/dashboard/services/mobile-dashboard-context.service';
import {InstrumentsService} from "@terminal-core-lib/features/instruments/services/instruments.service";
import {
  filter,
  forkJoin,
  map,
  Observable,
  switchMap
} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {AsyncPipe} from '@angular/common';
import {ScrollableRow} from '@terminal-core-lib/features/scrollable-row/components/scrollable-row/scrollable-row';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {ScrollableItem} from '@terminal-core-lib/features/scrollable-row/directives/scrollable-item';
import {TranslocoDirective} from '@jsverse/transloco';

interface InstrumentKeyViewData extends InstrumentKey {
  showInstrumentGroup: boolean;
}

@Component({
  selector: 'atsm-instruments-history',
  imports: [
    AsyncPipe,
    ScrollableRow,
    NzTagComponent,
    ScrollableItem,
    TranslocoDirective
  ],
  templateUrl: './instruments-history.html',
  styleUrl: './instruments-history.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentsHistory implements OnInit {
  instruments$!: Observable<InstrumentKeyViewData[] | undefined>;

  selectedInstrument$!: Observable<InstrumentKey | null | undefined>;

  private readonly mobileDashboardService = inject(MobileDashboardManageService);

  private readonly dashboardContextService = inject(MobileDashboardContextService);

  private readonly instrumentsService = inject(InstrumentsService);

  ngOnInit(): void {
    this.instruments$ = this.mobileDashboardService.getInstrumentsHistory()
      .pipe(
        filter(instruments => (instruments ?? []).length > 0),
        switchMap(instruments => {
          return forkJoin(
            instruments!.map(instrument =>
              this.instrumentsService.getInstrument({exchange: instrument.exchange, symbol: instrument.symbol})
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
        map(d => d[DefaultBadge])
      );
  }

  selectInstrument(instrument: InstrumentKey): void {
    this.dashboardContextService.selectDashboardInstrument(instrument, DefaultBadge);
  }

  isInstrumentEqual(i1: InstrumentKey, i2: InstrumentKey): boolean {
    return InstrumentEqualityComparer.equals(i1, i2);
  }
}
