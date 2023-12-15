import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarViewComponent } from './calendar-view.component';
import { EventsCalendarService } from "../../services/events-calendar.service";
import {
  of,
  Subject
} from "rxjs";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";
import { MarketService } from "../../../../shared/services/market.service";
import { LetDirective } from "@ngrx/component";

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetDirective],
      declarations: [
        CalendarViewComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: MarketService,
          useValue: {
            getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
          }
        },
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
