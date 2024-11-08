import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardsPanelComponent } from './dashboards-panel.component';
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {of} from "rxjs";
import {ngZorroMockComponents} from "../../../shared/utils/testing/ng-zorro-component-mocks";
import {SelectDashboardMenuComponent} from "../select-dashboard-menu/select-dashboard-menu.component";
import {MockComponent, MockDirective} from "ng-mocks";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('DashboardsPanelComponent', () => {
  let component: DashboardsPanelComponent;
  let fixture: ComponentFixture<DashboardsPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ...ngZorroMockComponents
      ],
      imports:[
        DashboardsPanelComponent,
        TranslocoTestsModule.getModule(),
        MockComponent(SelectDashboardMenuComponent),
        MockDirective(NzIconDirective)
      ],
      providers: [
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: of([]),
            selectDashboard: jasmine.createSpy('selectDashboard').and.callThrough(),
            changeFavoriteDashboardsOrder: jasmine.createSpy('changeFavoriteDashboardsOrder').and.callThrough(),
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
