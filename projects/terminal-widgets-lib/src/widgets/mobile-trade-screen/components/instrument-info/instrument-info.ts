import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {toObservable} from "@angular/core/rxjs-interop";
import {
  shareReplay,
  switchMap
} from "rxjs";
import {map} from "rxjs/operators";
import {AsyncPipe} from "@angular/common";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {
  InstrumentKey,
  InstrumentType
} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {InstrumentHelper} from '@terminal-core-lib/features/instruments/utils/instrument-helper';
import {StockInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/stock-info/stock-info';
import {BondInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/bond-info/bond-info';
import {DerivativeInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/derivative-info/derivative-info';
import {CommonInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/common-info/common-info';

@Component({
  selector: 'ats-instrument-info',
  imports: [
    AsyncPipe,
    NzSpinComponent,
    StockInfo,
    BondInfo,
    DerivativeInfo,
    CommonInfo,
  ],
  templateUrl: './instrument-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InstrumentInfo {
  readonly targetInstrument = input.required<InstrumentKey>();

  protected readonly isLoading = signal(false);

  protected readonly InstrumentTypes = InstrumentType;

  private readonly instrumentService = inject(InstrumentsService);

  protected readonly instrumentSummary$ = toObservable(this.targetInstrument).pipe(
    switchMap(instrument => this.instrumentService.getInstrument(instrument)),
    map(i => {
      if (i == null || i.instrumentGroup == null) {
        return null;
      }

      return {
        ...i,
        board: i.instrumentGroup!,
        typeByCfi: InstrumentHelper.getTypeByCfi(i.cfiCode)
      };
    }),
    shareReplay(1)
  );
}
