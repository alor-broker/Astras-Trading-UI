import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarViewComponent } from './calendar-view.component';
import { EventsCalendarService } from "../../services/events-calendar.service";
import { of } from "rxjs";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CalendarViewComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: EventsCalendarService,
          useValue: {
            getEvents: jasmine.createSpy('getEvents').and.returnValue(of({}))
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
