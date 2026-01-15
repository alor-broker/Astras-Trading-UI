import { Component, input, OnInit, inject } from '@angular/core';
import {InstrumentsService} from '../../../modules/instruments/services/instruments.service';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {distinctUntilChanged, Observable, of, switchMap} from 'rxjs';
import {isInstrumentEqual} from "../../utils/settings-helper";
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {AsyncPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";

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
  ],
  imports: [
    NzSelectComponent,
    FormsModule,
    NzOptionComponent,
    AsyncPipe
  ]
})
export class InstrumentBoardSelectComponent implements OnInit, ControlValueAccessor {
  private readonly instrumentsService = inject(InstrumentsService);

  currentValue: string | null = null;
  availableBoards$!: Observable<string[]>;
  readonly placeholder = input<string>();
  readonly instrument = input<{ symbol: string, exchange: string } | null>(null);
  private readonly instrumentChanges$ = toObservable(this.instrument);

  ngOnInit(): void {
    this.availableBoards$ = this.instrumentChanges$.pipe(
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
