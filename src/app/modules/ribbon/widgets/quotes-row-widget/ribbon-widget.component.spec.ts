import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RibbonWidgetComponent} from './ribbon-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {mockComponent, ngZorroMockComponents} from "../../../../shared/utils/testing";

describe('RibbonWidgetComponent', () => {
  let component: RibbonWidgetComponent;
  let fixture: ComponentFixture<RibbonWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        RibbonWidgetComponent,
        mockComponent({selector: 'ats-ribbon', inputs: ['guid']}),
        mockComponent({selector: 'ats-ribbon-settings', inputs: ['guid']}),
        ...ngZorroMockComponents
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
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RibbonWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
