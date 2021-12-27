import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { InstrumentSelect } from '../models/instrument-select.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  settings$!: Observable<InstrumentSelectSettings>;

  constructor() { }

  getInstruments(t: string): Observable<InstrumentSelect> {
    throw new Error('Method not implemented.');
  }
  unsubscribe() {
    throw new Error('Method not implemented.');
  }
  setSettings(settings: InstrumentSelectSettings) {
    throw new Error('Method not implemented.');
  }
}
