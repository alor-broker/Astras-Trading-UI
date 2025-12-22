import {Component, EventEmitter, input, Output} from '@angular/core';
import {toObservable} from "@angular/core/rxjs-interop";

export interface TargetInstrumentKey {
  symbol: string;
  exchange: string;
  board: string;
}

@Component({
  template: '',
  standalone: false
})
export abstract class InstrumentInfoBaseComponent {
  @Output()
  loadingChange = new EventEmitter<boolean>();

  readonly instrumentKey = input.required<TargetInstrumentKey>();
  protected readonly instrumentKeyChanges$ = toObservable(this.instrumentKey);

  setLoading(value: boolean): void {
    this.loadingChange.emit(value);
  }
}
