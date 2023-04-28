import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable, map } from "rxjs";
import { CalendarEvent, CalendarEvents } from "../models/events-calendar.model";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

interface AllEventsRequest {
  dateFrom: string;
  dateTo: string;
  symbols: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EventsCalendarService {

  baseUrl = environment.apiUrl + '/instruments/v1';

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getEvents(req: AllEventsRequest): Observable<CalendarEvents> {
    return this.http.post<CalendarEvents>(this.baseUrl + '/eventsCalendar', req)
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
    return this.http.post<CalendarEvent>(this.baseUrl + '/dailyEvents', {
      eventDate: date
    })
      .pipe(
        catchHttpError<CalendarEvent | null>(null, this.errorHandlerService)
      );
  }
}
