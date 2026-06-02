import {
  inject,
  Injectable
} from '@angular/core';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {EventsBusService} from '../../../common/services/events-bus.service';
import {
  Observable,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';
import {
  GroupCreatedEventKey,
  OrdersGroup
} from '../types/order-group.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable()
export class OrdersGroupService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly eventBusService = inject(EventsBusService);

  private readonly orderGroupsUrl = this.coreApiUrlProvider.apiUrl + '/commandapi/api/orderGroups';

  private orderGroups$?: Observable<OrdersGroup[]>;

  getAllOrderGroups(): Observable<OrdersGroup[]> {
    this.orderGroups$ ??= this.eventBusService.subscribe(event => event.key === GroupCreatedEventKey)
      .pipe(
        startWith(null),
        switchMap(() => this.httpClient.get<OrdersGroup[]>(`${this.orderGroupsUrl}`)),
        catchHttpError<OrdersGroup[]>([], this.errorHandlerService),
        shareReplay(1)
      );

    return this.orderGroups$;
  }
}
