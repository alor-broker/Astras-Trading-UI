import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {InstrumentsService} from '../../services/instruments.service';
import {
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap
} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {InstrumentEqualityComparer} from '../../../../common/utils/instrument-key.helper';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-instrument-board-select',
  imports: [
    NzSelectComponent,
    FormsModule,
    AsyncPipe,
    NzOptionComponent
  ],
  templateUrl: './instrument-board-select.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InstrumentBoardSelect)
    }
  ],
})
export class InstrumentBoardSelect implements OnInit, ControlValueAccessor {
  currentValue: string | null = null;

  availableBoards$!: Observable<string[]>;

  readonly placeholder = input<string>();

  readonly instrument = input<{ symbol: string, exchange: string } | null>(null);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly instrumentChanges$ = toObservable(this.instrument);

  ngOnInit(): void {
    this.availableBoards$ = this.instrumentChanges$.pipe(
      distinctUntilChanged((previous, current) => InstrumentEqualityComparer.equals(previous, current)),
      switchMap(instrument => {
        if (!instrument) {
          return of([]);
        }

        return this.instrumentsService.getInstrumentBoards(instrument);
      }),
      map(x => x ?? [])
    );
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  writeValue(board: string): void {
    this.currentValue = board;
  }

  selectBoard(value: string): void {
    this.onTouched();
    this.onValueChanged(value);
  }

  private onValueChanged: (value: string | null) => void = () => {
  };

  private onTouched = (): void => {
  };
}
