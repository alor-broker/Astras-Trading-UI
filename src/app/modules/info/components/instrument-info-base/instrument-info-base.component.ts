import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { BehaviorSubject } from "rxjs";

export interface TargetInstrumentKey {
  symbol: string;
  exchange: string;
  board: string;
}

@Component({
    template: '',
    standalone: false
})
export abstract class InstrumentInfoBaseComponent implements OnDestroy {
  readonly targetInstrumentKey$ = new BehaviorSubject<TargetInstrumentKey | null>(null);

  @Output()
  loadingChange = new EventEmitter<boolean>();

  @Input({required: true})
  set instrumentKey(value: TargetInstrumentKey) {
    this.targetInstrumentKey$.next(value);
  };

  ngOnDestroy(): void {
    this.targetInstrumentKey$.complete();
  }

  setLoading(value: boolean): void {
    setTimeout(() => this.loadingChange.emit(value));
  }
}
