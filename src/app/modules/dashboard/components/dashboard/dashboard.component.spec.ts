import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';

import { DashboardComponent } from './dashboard.component';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        DashboardComponent,
        ComponentHelpers.mockComponent({
          selector: 'gridster',
          inputs: ['options']
        })
      ],
      providers: [
        {
          provide: ManageDashboardsService,
          useValue: {
            updateWidgetPositions: jasmine.createSpy('updateWidgetPositions').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: new Subject()
          }
        },
        {
          provide: WidgetsMetaService,
          useValue: {
            getWidgetsMeta: jasmine.createSpy('getWidgetsMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        }
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
