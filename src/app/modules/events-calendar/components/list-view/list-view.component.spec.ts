import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListViewComponent } from './list-view.component';
import { EventsCalendarService } from "../../services/events-calendar.service";
import { of } from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('ListViewComponent', () => {
  let component: ListViewComponent;
  let fixture: ComponentFixture<ListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListViewComponent ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        {
          provide: EventsCalendarService,
          useValue: {
            getEvents: jasmine.createSpy('getEvents').and.returnValue(of({}))
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectDashboardInstrument: jasmine.createSpy('selectDashboardInstrument').and.callThrough()
          }
        }
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