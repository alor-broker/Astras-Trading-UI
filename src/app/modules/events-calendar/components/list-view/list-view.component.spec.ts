import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ListViewComponent } from './list-view.component';
import { EventsCalendarService } from "../../services/events-calendar.service";
import {
  of,
  Subject
} from "rxjs";
import { MarketService } from "../../../../shared/services/market.service";
import { LetDirective } from "@ngrx/component";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('ListViewComponent', () => {
  let component: ListViewComponent;
  let fixture: ComponentFixture<ListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        ListViewComponent
    ],
    providers: [
        {
            provide: EventsCalendarService,
            useValue: {
                getEvents: jasmine.createSpy('getEvents').and.returnValue(of({}))
            }
        },
        {
            provide: ACTIONS_CONTEXT,
            useValue: {
                instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
            }
        },
        {
            provide: MarketService,
            useValue: {
                getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
            }
        },
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(ListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
