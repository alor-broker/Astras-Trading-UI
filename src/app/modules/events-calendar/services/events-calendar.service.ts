import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { CalendarEvents } from "../models/events-calendar.model";

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
    private readonly http: HttpClient
  ) {
  }

  getEvents(req: AllEventsRequest): Observable<CalendarEvents> {
    return this.http.post<CalendarEvents>(this.baseUrl + '/eventsCalendar', req);
  }

  getDailyEvents(date: Date): Observable<Array<any>> {
    return this.http.post<Array<any>>(this.baseUrl + '/dailyEvents', {
      eventDate: date
    });
  }
}
