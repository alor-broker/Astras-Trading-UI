import { Injectable } from '@angular/core';
import { Observable, } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Quote } from '../models/quotes/quote.model';
import { QuotesRequest } from '../models/quotes/quotes-request.model';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { ChartSubscriptionIdHelper } from '../utils/subscription-id-helper';

@Injectable({
  providedIn: 'root'
})
export class QuotesService {
  constructor(private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService) {
  }

  getQuotes(symbol: string, exchange: string, instrumentGroup?: string): Observable<Quote> {
    const request: QuotesRequest = {
      opcode: "QuotesSubscribe",
      code: symbol,
      exchange: exchange,
      format: "simple",
      instrumentGroup: instrumentGroup
    };

    return this.subscriptionsDataFeedService.subscribe<QuotesRequest, Quote>(request, ChartSubscriptionIdHelper.getQuotesSubscriptionId).pipe(
      filter((q): q is Quote => !!q)
    );
  }
}
