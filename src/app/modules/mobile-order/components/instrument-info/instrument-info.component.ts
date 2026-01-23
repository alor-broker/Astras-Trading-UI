import {
  Component,
  inject,
  input,
  signal
} from '@angular/core';
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  shareReplay,
  switchMap
} from "rxjs";
import { map } from "rxjs/operators";
import { getTypeByCfi } from "../../../../shared/utils/instruments";
import { AsyncPipe } from "@angular/common";
import { BondInfoComponent } from "../../../info/components/bonds/bond-info/bond-info.component";
import { CommonInfoComponent } from "../../../info/components/common/common-info/common-info.component";
import { DerivativeInfoComponent } from "../../../info/components/derivatives/derivative-info/derivative-info.component";
import { NzSpinComponent } from "ng-zorro-antd/spin";
import { StockInfoComponent } from "../../../info/components/stocks/stock-info/stock-info.component";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";

@Component({
  selector: 'ats-instrument-info',
  imports: [
    AsyncPipe,
    BondInfoComponent,
    CommonInfoComponent,
    DerivativeInfoComponent,
    NzSpinComponent,
    StockInfoComponent
  ],
  templateUrl: './instrument-info.component.html',
  styleUrl: './instrument-info.component.less',
})
export class InstrumentInfoComponent {
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
        typeByCfi: getTypeByCfi(i.cfiCode)
      };
    }),
    shareReplay(1)
  );
}
