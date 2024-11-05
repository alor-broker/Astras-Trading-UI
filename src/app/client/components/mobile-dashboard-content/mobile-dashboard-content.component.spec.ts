import { ComponentFixture, TestBed } from '@angular/core/testing';
import {MobileDashboardContentComponent} from "./mobile-dashboard-content.component";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {of, Subject} from "rxjs";
import {WidgetsMetaService} from "../../../shared/services/widgets-meta.service";
import {MobileActionsContextService} from "../../../modules/dashboard/services/mobile-actions-context.service";
import {MobileDashboardService} from "../../../modules/dashboard/services/mobile-dashboard.service";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {MockDirective} from "ng-mocks";

describe('MobileDashboardContentComponent', () => {
  let component: MobileDashboardContentComponent;
  let fixture: ComponentFixture<MobileDashboardContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MobileDashboardContentComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzIconDirective)
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

    fixture = TestBed.createComponent(MobileDashboardContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
