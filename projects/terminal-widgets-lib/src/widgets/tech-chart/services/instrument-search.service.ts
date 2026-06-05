import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {BehaviorSubject} from "rxjs";

interface SearchInstrumentModalParams {
  value: string;
  needTextSelection?: boolean;
}

@Injectable()
export class InstrumentSearchService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly isModalOpened = new BehaviorSubject(false);

  isModalOpened$ = this.isModalOpened.asObservable();

  private readonly modalParams = new BehaviorSubject<SearchInstrumentModalParams | null>(null);

  modalParams$ = this.modalParams.asObservable();

  private readonly modalData = new BehaviorSubject<string | null>(null);

  modalData$ = this.modalData.asObservable();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.isModalOpened.complete();
      this.modalParams.complete();
      this.modalData.complete();
    });
  }

  openModal(params: SearchInstrumentModalParams | null): void {
    this.modalParams.next(params);
    this.isModalOpened.next(true);
  }

  closeModal(data: string | null): void {
    this.modalData.next(data);
    this.isModalOpened.next(false);
  }
}
