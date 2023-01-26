import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { SelectDashboardMenuComponent } from './select-dashboard-menu.component';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import { Subject } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { getTranslocoModule } from '../../../../shared/utils/testing';

describe('SelectDashboardMenuComponent', () => {
  let component: SelectDashboardMenuComponent;
  let fixture: ComponentFixture<SelectDashboardMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [SelectDashboardMenuComponent],
      providers: [
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: new Subject(),
            addDashboard: jasmine.createSpy('addDashboard').and.callThrough(),
            selectDashboard: jasmine.createSpy('selectDashboard').and.callThrough(),
            removeDashboard: jasmine.createSpy('removeDashboard').and.callThrough(),
            renameDashboard: jasmine.createSpy('renameDashboard').and.callThrough()
          }
        },
        {
          provide: NzModalService,
          useValue: {
            confirm: jasmine.createSpy('confirm').and.callThrough(),
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            allDashboards$: new Subject(),
            addDashboard: jasmine.createSpy('addDashboard').and.callThrough(),
            selectDashboard: jasmine.createSpy('selectDashboard').and.callThrough(),
            removeDashboard: jasmine.createSpy('removeDashboard').and.callThrough(),
            renameDashboard: jasmine.createSpy('renameDashboard').and.callThrough()
          }
        },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SelectDashboardMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
