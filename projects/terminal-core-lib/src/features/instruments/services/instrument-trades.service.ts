import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {SubscriptionsDataFeedService} from '../../data-subscriptions/services/subscriptions-data-feed.service';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {
  InstrumentTradesFilters,
  InstrumentTradesItem,
  InstrumentTradesPagination,
  InstrumentTradesSort,
  InstrumentTradesSubRequest
} from './instrument-trades-service.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable({providedIn: 'root'})
export class InstrumentTradesService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly allTradesUrl = this.coreApiUrlProvider.apiUrl + '/md/v2/Securities';

  public getTradesList(
    instrumentKey: InstrumentKey,
    filters?: InstrumentTradesFilters,
    pagination?: InstrumentTradesPagination,
    sort?: InstrumentTradesSort
  ): Observable<InstrumentTradesItem[]> {
    const params: Record<string, string | number | boolean> = {
      ...filters,
      ...pagination,
      ...sort
    };

    if (instrumentKey.instrumentGroup != null && instrumentKey.instrumentGroup.length > 0) {
      params.instrumentGroup = instrumentKey.instrumentGroup;
    }

    return this.httpClient.get<InstrumentTradesItem[]>(`${this.allTradesUrl}/${instrumentKey.exchange}/${instrumentKey.symbol}/alltrades`, {
      params
    })
      .pipe(
        catchHttpError<InstrumentTradesItem[]>([], this.errorHandlerService)
      );
  }

  public getNewTradesSubscription(instrumentKey: InstrumentKey, depth?: number): Observable<InstrumentTradesItem> {
    const request: InstrumentTradesSubRequest = {
      opcode: 'AllTradesSubscribe',
      code: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      instrumentGroup: instrumentKey.instrumentGroup ?? '',
      depth: depth,
      format: 'simple',
      repeatCount: depth
    };

    return this.subscriptionsDataFeedService.subscribe(
      request,
      request => `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${depth ?? 1}`
    );
  }
}
