import { TestBed } from '@angular/core/testing';

import { EventsCalendarService } from './events-calendar.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe('EventsCalendarService', () => {
  let service: EventsCalendarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(EventsCalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
