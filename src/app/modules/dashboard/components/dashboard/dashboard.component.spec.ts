import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';

import { DashboardComponent } from './dashboard.component';
import { mockComponent } from "../../../../shared/utils/testing";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        DashboardComponent,
        mockComponent({
          selector: 'gridster',
          inputs: ['options']
        })
      ],
      providers: [
        {
          provide: ManageDashboardsService,
          useValue: {
            updateWidgetPosition: jasmine.createSpy('updateWidgetPosition').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: new Subject()
          }
        },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
