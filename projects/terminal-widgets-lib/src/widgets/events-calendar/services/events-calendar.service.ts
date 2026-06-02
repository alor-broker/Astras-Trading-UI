import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  map,
  Observable
} from "rxjs";
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {
  CalendarEvent,
  CalendarEvents
} from '@terminal-widgets-lib/widgets/events-calendar/types/events-calendar.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

interface AllEventsRequest {
  dateFrom: string;
  dateTo: string;
  symbols: string[];
}

@Injectable()
export class EventsCalendarService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  baseUrl = this.coreApiUrlProvider.apiUrl + '/instruments/v1';

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  getEvents(req: AllEventsRequest): Observable<CalendarEvents> {
    return this.httpClient.post<CalendarEvents>(this.baseUrl + '/eventsCalendar', req)
      .pipe(
        map(res => {
          return Object.entries(res).reduce((acc, [key, value]) => {
            acc[key] = {
              ...value,
              date: new Date(key)
            };
            return acc;
          }, {} as CalendarEvents);
        }),
        catchHttpError<CalendarEvents>({}, this.errorHandlerService)
      );
  }

  getDailyEvents(date: Date): Observable<CalendarEvent | null> {
    return this.httpClient.post<CalendarEvent>(this.baseUrl + '/dailyEvents', {
      eventDate: date
    })
      .pipe(
        catchHttpError<CalendarEvent | null>(null, this.errorHandlerService)
      );
  }
}
