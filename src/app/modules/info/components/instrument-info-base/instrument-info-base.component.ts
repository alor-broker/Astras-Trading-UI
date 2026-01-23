import {
  Component,
  input,
  output
} from '@angular/core';
import { toObservable } from "@angular/core/rxjs-interop";

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
  readonly loadingChange = output<boolean>();

  readonly instrumentKey = input.required<TargetInstrumentKey>();

  readonly displayMode = input<'tabs' | 'vertical'>('tabs');

  protected readonly instrumentKeyChanges$ = toObservable(this.instrumentKey);

  setLoading(value: boolean): void {
    this.loadingChange.emit(value);
  }
}
