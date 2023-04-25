import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsCalendarComponent } from './events-calendar.component';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import ruEventsCalendarTranslations from '../../../../../assets/i18n/events-calendar/ru.json';

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
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'application-meta/application-meta-service': ruEventsCalendarTranslations
          }
        })
      ],
      providers: [...commonTestProviders]
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
