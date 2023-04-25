import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { CalendarEvents } from "../models/events-calendar.model";

@Injectable({
  providedIn: 'root'
})
export class EventsCalendarService {

  baseUrl = environment.apiUrl + '/instruments/v1';

  constructor(
    private readonly http: HttpClient
  ) {
  }

  getEvents(): Observable<CalendarEvents> {
    // return this.http.post<Array<any>>(this.baseUrl + '/eventsCalendar', {});
    return of({
      "2023-04-21T15:21:52.6507833+03:00": [
        {
          "symbol": "RU000A101ZV5",
          "exchange": "MOEX",
          "dividendEvent": null,
          "bondEvent": {
            "couponEvent": {
              "accruedInterest": 11.2,
              "intervalInDays": 22.12,
              "couponType": "FLOAT",
              "amount": 33,
              "currency": "RUB",
            },
            "amortizationEvent": null,
            "offerEvent": null
          }
        },
        {
          "symbol": "RU000A101ZV5",
          "exchange": "MOEX",
          "dividendEvent": null,
          "bondEvent": {
            "couponEvent": null,
            "amortizationEvent": {
              "parFraction": 0,
              "amount": 3,
              "currency": "RUB",
            },
            "offerEvent": null
          }
        }
      ],
      "2023-04-27T15:21:52.6507856+03:00": [{
        "symbol": "RU000A101ZV5",
        "exchange": "MOEX",
        "dividendEvent": null,
        "bondEvent": {
          "couponEvent": null,
          "amortizationEvent": null,
          "offerEvent": {
            "description": "Call-опцион",
            "bondEventType": "CALL",
            date: '2023-04-27'
          }
        }
      }],
      "2023-05-12T15:21:52.6507862+03:00": [{
        "symbol": "SBER",
        "exchange": "MOEX",
        "dividendEvent": {
          "dividendPerShare": 23,
          "dividendYield": 45.2,
          "currency": "RUB"
        },
        "bondEvent": null
      }]
    });
  }

  getDailyEvents(date: Date): Observable<Array<any>> {
    return this.http.post<Array<any>>(this.baseUrl + '/dailyEvents', {
      eventDate: date
    });
  }
}
