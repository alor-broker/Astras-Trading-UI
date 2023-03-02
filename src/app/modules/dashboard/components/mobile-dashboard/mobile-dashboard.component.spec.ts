import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileDashboardComponent } from './mobile-dashboard.component';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { of } from "rxjs";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('MobileDashboardComponent', () => {
  let component: MobileDashboardComponent;
  let fixture: ComponentFixture<MobileDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileDashboardComponent ],
      imports: [ getTranslocoModule() ],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: of({})
          }
        },
        {
          provide: MobileDashboardService,
          useValue: {
            changeDashboardTab: jasmine.createSpy('changeDashboardTab').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
