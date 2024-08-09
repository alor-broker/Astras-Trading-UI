import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileDashboardComponent } from './mobile-dashboard.component';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { of, Subject } from "rxjs";
import { getTranslocoModule } from "../../../../shared/utils/testing";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { MobileActionsContextService } from "../../services/mobile-actions-context.service";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";
import { LetDirective } from "@ngrx/component";

describe('MobileDashboardComponent', () => {
  let component: MobileDashboardComponent;
  let fixture: ComponentFixture<MobileDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MobileDashboardComponent],
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: of({})
          }
        },
        {
          provide: WidgetsMetaService,
          useValue: {
            getWidgetsMeta: jasmine.createSpy('getWidgetsMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: MobileActionsContextService,
          useValue: {
            actionEvents$: new Subject()
          }
        },
        {
          provide: MobileDashboardService,
          useValue: {
            addWidget: jasmine.createSpy('addWidget').and.callThrough()
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
