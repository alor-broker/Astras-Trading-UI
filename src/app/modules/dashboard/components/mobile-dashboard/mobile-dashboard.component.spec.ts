import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileDashboardComponent } from './mobile-dashboard.component';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { of } from "rxjs";
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
