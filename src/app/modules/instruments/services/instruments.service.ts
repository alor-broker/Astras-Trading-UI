import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { environment } from 'src/environments/environment';
import { InstrumentSelect } from '../models/instrument-select.model';
import { InstrumentSearchResponse } from '../../../shared/models/instruments/instrument-search-response.model';
import { SearchFilter } from '../models/search-filter.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BaseService } from 'src/app/shared/services/base.service';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService extends BaseService<InstrumentSelectSettings> {
  private url = environment.apiUrl + '/md/v2/Securities';

  constructor(
    settingsService: DashboardService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
    ) {
    super(settingsService);
  }

  getInstrument(instrument: InstrumentKey): Observable<InstrumentSelect | null> {
    const instrumentGroup = instrument.instrumentGroup ?? "";
    return this.http.get<InstrumentSearchResponse>(`${this.url}/${instrument.exchange}/${instrument.symbol}`, {
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
        };
        return selected;
      }),
      catchHttpError<InstrumentSelect | null>(null, this.errorHandlerService),
    );
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
        }));
        return selects;
      })
    );
  }
}
