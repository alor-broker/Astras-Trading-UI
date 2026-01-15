import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdminClientsComponent} from './admin-clients.component';
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {AdminClientsService} from "../../services/clients/admin-clients.service";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {
  NzFilterTriggerComponent,
  NzTableCellDirective,
  NzTableComponent,
  NzThAddOnComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {
  TableSearchFilterComponent
} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('AdminClientsComponent', () => {
  let component: AdminClientsComponent;
  let fixture: ComponentFixture<AdminClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminClientsComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzTableComponent,
          TableSearchFilterComponent,
          NzThAddOnComponent,
          NzFilterTriggerComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          TableRowHeightDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzMenuDirective,
        )
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(AdminClientsService),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: () => EMPTY
          }
        ),
        MockProvider(ManageDashboardsService),
        MockProvider(NzContextMenuService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminClientsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
