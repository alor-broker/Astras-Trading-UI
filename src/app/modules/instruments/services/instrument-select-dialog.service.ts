import {
  Injectable,
  OnDestroy
} from '@angular/core';
import { BehaviorSubject } from "rxjs";

export interface InstrumentSelectDialogParams {

}

@Injectable({
  providedIn: 'root'
})
export class InstrumentSelectDialogService implements OnDestroy {
  private readonly currentParams$ = new BehaviorSubject<InstrumentSelectDialogParams | null>(null);
  readonly selectParams$ = this.currentParams$.asObservable();

  ngOnDestroy(): void {
    this.currentParams$.complete();
  }

  openDialog(params: InstrumentSelectDialogParams): void {
    this.currentParams$.next(params);
  }

  closeDialog(): void {
    this.currentParams$.next(null);
  }
}
