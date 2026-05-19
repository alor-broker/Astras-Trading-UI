import {
  inject,
  Injectable
} from '@angular/core';
import {
  filter,
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {
  ExchangeSettings,
  MarketExchange,
  MarketSettings
} from './market-config.types';
import {HttpContextTokens} from '../http-requests/constants/http.constants';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class MarketService {
  private readonly httpClient = inject(HttpClient);

  private settings$?: Observable<MarketSettings>;

  getMarketSettings(): Observable<MarketSettings> {
    this.settings$ ??= this.httpClient.get<MarketSettings>(
      '/assets/market-settings-config.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    )
      .pipe(
        shareReplay(1)
      );

    return this.settings$;
  }

  getExchangeSettings(exchange: string): Observable<ExchangeSettings> {
    return this.getExchangeSettingsIfExists(exchange).pipe(
      filter((x): x is ExchangeSettings => !!x)
    );
  }

  getExchangeSettingsIfExists(exchange: string): Observable<ExchangeSettings | null> {
    return this.getMarketSettings()
      .pipe(
        map(s => (s.exchanges.find(x => x.exchange === exchange)?.settings) ?? null),
      );
  }

  getAllExchanges(): Observable<MarketExchange[]> {
    return this.getMarketSettings().pipe(
      map(x => x.exchanges)
    );
  }

  getDefaultExchange(): Observable<string | undefined> {
    return this.getMarketSettings().pipe(
      map(x => x.exchanges.find(ex => ex.settings.isDefault ?? false)?.exchange)
    );
  }

}
