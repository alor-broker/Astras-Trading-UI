import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardsPanelComponent } from './dashboards-panel.component';
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { of } from "rxjs";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('DashboardsPanelComponent', () => {
  let component: DashboardsPanelComponent;
  let fixture: ComponentFixture<DashboardsPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardsPanelComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: of([]),
            selectDashboard: jasmine.createSpy('selectDashboard').and.callThrough(),
            changeFavoriteDashboardsOrder: jasmine.createSpy('changeFavoriteDashboardsOrder').and.callThrough(),
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('selectDashboard').and.returnValue(of(() => ''))
          }
        }
      ]
    });
    fixture = TestBed.createComponent(DashboardsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
