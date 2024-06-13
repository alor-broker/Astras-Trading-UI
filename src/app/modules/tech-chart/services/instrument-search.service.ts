import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable()
export class InstrumentSearchService {

  private readonly isModalOpened = new BehaviorSubject(false);
  isModalOpened$ = this.isModalOpened.asObservable();

  private readonly modalParams = new BehaviorSubject<string | null>(null);
  modalParams$ = this.modalParams.asObservable();

  private readonly modalData = new BehaviorSubject<string | null>(null);
  modalData$ = this.modalData.asObservable();

  openModal(params: string | null): void {
    this.modalParams.next(params);
    this.isModalOpened.next(true);
  }

  closeModal(data: string | null): void {
    this.modalData.next(data);
    this.isModalOpened.next(false);
  }
}
