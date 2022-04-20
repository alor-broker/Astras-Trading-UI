import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { environment } from 'src/environments/environment';
import { InstrumentSelect } from '../models/instrument-select.model';
import { InstrumentSearchResponse } from '../../../shared/models/instruments/instrument-search-response.model';
import { SearchFilter } from '../models/search-filter.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BaseService } from 'src/app/shared/services/base.service';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService extends BaseService<InstrumentSelectSettings> {
  private url = environment.apiUrl + '/md/v2/Securities';

  constructor(private http: HttpClient, settingsService: DashboardService) {
    super(settingsService);
  }

  getInstrument(instrument: InstrumentKey): Observable<InstrumentSelect> {
    const instrumentGroup = instrument.instrumentGroup ?? "";
    return this.http.get<InstrumentSearchResponse>(this.url, {
      params: { instrumentGroup: instrumentGroup }
    }).pipe(
      map(r => {
        const selected : InstrumentSelect = {
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board,
          isin: r.ISIN,
          currency: r.currency
        }
        return selected
      })
    )
  }

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
          instrumentGroup: r.board,
          isin: r.ISIN,
          currency: r.currency
        }))
        return selects
      })
    )
  }
}
