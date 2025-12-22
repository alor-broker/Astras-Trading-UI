import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RibbonWidgetComponent} from './ribbon-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import {
  MockComponents, MockDirectives
} from "ng-mocks";
import { RibbonComponent } from "../../components/ribbon/ribbon.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('RibbonWidgetComponent', () => {
  let component: RibbonWidgetComponent;
  let fixture: ComponentFixture<RibbonWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      RibbonWidgetComponent,
      MockComponents(
        RibbonComponent,
        NzButtonComponent
      ),
      MockDirectives(
        NzIconDirective
      )
    ],
    providers: [
        {
            provide: WidgetSettingsService,
            useValue: {
                getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
                getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
                addSettings: jasmine.createSpy('addSettings').and.callThrough()
            }
        },
        {
            provide: ManageDashboardsService,
            useValue: {
                removeWidget: jasmine.createSpy('removeWidget').and.callThrough()
            }
        },
        {
            provide: DashboardContextService,
            useValue: {
                selectedDashboard$: new Subject(),
            }
        }
    ]
})
      .compileComponents();

    fixture = TestBed.createComponent(RibbonWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
