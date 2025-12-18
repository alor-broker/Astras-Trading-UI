import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EventsCalendarComponent} from './events-calendar.component';
import ruEventsCalendarTranslations from '../../../../../assets/i18n/events-calendar/ru.json';
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {PortfoliosFeature} from "../../../../store/portfolios/portfolios.reducer";
import {PositionsService} from "../../../../shared/services/positions.service";
import {EMPTY, NEVER} from "rxjs";
import {MarketService} from "../../../../shared/services/market.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {USER_CONTEXT} from "../../../../shared/services/auth/user-context";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {CalendarViewComponent} from "../calendar-view/calendar-view.component";
import {ListViewComponent} from "../list-view/list-view.component";
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";

describe('EventsCalendarComponent', () => {
  let component: EventsCalendarComponent;
  let fixture: ComponentFixture<EventsCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        TranslocoTestsModule.getModule({
          langs: {
            'events-calendar': ruEventsCalendarTranslations
          }
        }),
        EventsCalendarComponent,
        MockComponents(
          NzTabsComponent,
          NzTabComponent,
          NzButtonComponent,
          CalendarViewComponent,
          ListViewComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent
        ),
        MockDirectives(
          NzDropdownButtonDirective,
          NzDropDownDirective,
          NzMenuDirective
        )
      ],
      providers: [
        {
          provide: PositionsService,
          useValue: {
            getAllByLogin: jasmine.createSpy('getAllByLogin').and.returnValue(EMPTY),
            getAllByPortfolio: jasmine.createSpy('getAllByPortfolio').and.returnValue(EMPTY),
          }
        },
        {
          provide: MarketService,
          useValue: {
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
