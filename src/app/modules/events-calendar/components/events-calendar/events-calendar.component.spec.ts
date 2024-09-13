import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsCalendarComponent } from './events-calendar.component';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import ruEventsCalendarTranslations from '../../../../../assets/i18n/events-calendar/ru.json';
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { USER_CONTEXT } from "../../../../shared/services/auth/user-context";
import { NEVER } from "rxjs";

describe('EventsCalendarComponent', () => {
  let component: EventsCalendarComponent;
  let fixture: ComponentFixture<EventsCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EventsCalendarComponent,
        mockComponent({
          selector: 'ats-calendar-view'
        }),
        mockComponent({
          selector: 'ats-list-view'
        })
      ],
      imports: [
        NoopAnimationsModule,
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'events-calendar': ruEventsCalendarTranslations
          }
        })
      ],
      providers: [
        {
          provide: USER_CONTEXT,
          useValue: {
            getUser: jasmine.createSpy('getUser').and.returnValue(NEVER)
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
