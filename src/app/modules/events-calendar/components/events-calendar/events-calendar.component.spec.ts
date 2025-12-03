import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { EventsCalendarComponent } from './events-calendar.component';
import ruEventsCalendarTranslations from '../../../../../assets/i18n/events-calendar/ru.json';
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";
import { PositionsService } from "../../../../shared/services/positions.service";
import {
  EMPTY,
  NEVER
} from "rxjs";
import { MarketService } from "../../../../shared/services/market.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { NzTabsModule } from "ng-zorro-antd/tabs";
import { USER_CONTEXT } from "../../../../shared/services/auth/user-context";

describe('EventsCalendarComponent', () => {
  let component: EventsCalendarComponent;
  let fixture: ComponentFixture<EventsCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EventsCalendarComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-calendar-view'
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-list-view'
        })
      ],
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        NoopAnimationsModule,
        TranslocoTestsModule.getModule({
          langs: {
            'events-calendar': ruEventsCalendarTranslations
          }
        }),
        NzTabsModule
      ],
      providers: [
        {
          provide: PositionsService,
          useValue:{
            getAllByLogin: jasmine.createSpy('getAllByLogin').and.returnValue(EMPTY),
            getAllByPortfolio: jasmine.createSpy('getAllByPortfolio').and.returnValue(EMPTY),
          }
        },
        {
          provide: MarketService,
          useValue:{
            getDefaultExchange: jasmine.createSpy('getDefaultExchange').and.returnValue(EMPTY),
          }
          },
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
