import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { environment } from 'src/environments/environment';
import { InstrumentSelect } from '../models/instrument-select.model';
import { InstrumentSearchResponse } from '../models/instrument-search-response.model';
import { SearchFilter } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private url = environment.apiUrl + '/md/v2/Securities';
  private settings = new BehaviorSubject<InstrumentSelectSettings | null>(null);
  settings$: Observable<InstrumentSelectSettings> = this.settings.asObservable().pipe(
    filter((s): s is InstrumentSelectSettings => !!s)
  );

  constructor(private http: HttpClient) { }

  getInstruments(filter: SearchFilter): Observable<InstrumentSelect[]> {
    return this.http.get<InstrumentSearchResponse[]>(this.url, {
      params: { ...filter },
     }).pipe(
      map(resp => {
        const selects : InstrumentSelect[] = resp.map(r => ({
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.primary_board,
          isin: r.ISIN,
          currency: r.currency
        }))
        return selects
      })
    )
  }
  unsubscribe() {

  }

  setSettings(settings: InstrumentSelectSettings) {
    this.settings.next(settings);
  }
}
