import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardsPanelComponent } from './dashboards-panel.component';
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {of} from "rxjs";
import {SelectDashboardMenuComponent} from "../select-dashboard-menu/select-dashboard-menu.component";
import {MockComponents, MockDirectives} from "ng-mocks";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzSegmentedComponent} from "ng-zorro-antd/segmented";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";

describe('DashboardsPanelComponent', () => {
  let component: DashboardsPanelComponent;
  let fixture: ComponentFixture<DashboardsPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [
        DashboardsPanelComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          SelectDashboardMenuComponent,
          NzSegmentedComponent,
          NzButtonComponent,
          NzDropdownMenuComponent
        ),
        MockDirectives(
          NzIconDirective,
          NzTooltipDirective,
          NzIconDirective
        ),
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
