import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  of,
  switchMap
} from 'rxjs';
import { isInstrumentEqual } from "../../utils/settings-helper";


@Component({
  selector: 'ats-instrument-board-select',
  templateUrl: './instrument-board-select.component.html',
  styleUrls: ['./instrument-board-select.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InstrumentBoardSelectComponent
    }
  ]
})
export class InstrumentBoardSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  currentValue: string | null = null;
  availableBoards$!: Observable<string[]>;
  @Input()
  placeholder?: string;
  private readonly instrument$ = new BehaviorSubject<{ symbol: string, exchange: string } | null>(null);

  constructor(private readonly instrumentsService: InstrumentsService) {
  }

  @Input({required: true})
  set instrument(value: { symbol: string, exchange: string } | null) {
    this.instrument$.next(value);
  }

  ngOnDestroy(): void {
    this.instrument$.complete();
  }

  ngOnInit(): void {
    this.availableBoards$ = this.instrument$.pipe(
      distinctUntilChanged((previous, current) => isInstrumentEqual(previous, current)),
      switchMap(instrument => {
        if (!instrument) {
          return of([]);
        }

        return this.instrumentsService.getInstrumentBoards(instrument);
      })
    );
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: (...args: any[]) => any): void {
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
