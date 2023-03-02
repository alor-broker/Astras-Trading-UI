import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileInstrumentsHistoryComponent } from './mobile-instruments-history.component';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { of } from "rxjs";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";

describe('MobileInstrumentsHistoryComponent', () => {
  let component: MobileInstrumentsHistoryComponent;
  let fixture: ComponentFixture<MobileInstrumentsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileInstrumentsHistoryComponent ],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({}),
            selectMobileDashboardInstrument: jasmine.createSpy('selectMobileDashboardInstrument').and.callThrough()
          }
        },
        {
          provide: MobileDashboardService,
          useValue: {
            instruments$: of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileInstrumentsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
