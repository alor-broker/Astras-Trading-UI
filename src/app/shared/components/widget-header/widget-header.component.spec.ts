import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { WidgetHeaderComponent } from './widget-header.component';
import { WidgetSettingsService } from '../../services/widget-settings.service';
import { ManageDashboardsService } from '../../services/manage-dashboards.service';
import {TranslatorService} from "../../services/translator.service";
import {DashboardContextService} from "../../services/dashboard-context.service";
import { of, Subject } from "rxjs";
import { EnvironmentService } from "../../services/environment.service";
import { HelpService } from "../../services/help.service";
import { TerminalSettingsService } from "../../services/terminal-settings.service";
import { ngZorroMockComponents } from "../../utils/testing/ng-zorro-component-mocks";

describe('WidgetHeaderComponent', () => {
  let component: WidgetHeaderComponent;
  let fixture: ComponentFixture<WidgetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WidgetHeaderComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
            updateIsLinked: jasmine.createSpy('updateIsLinked').and.callThrough(),
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
            instrumentsSelection$: new Subject()
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              help: ''
            }
          }
        },
        {
          provide: HelpService,
          useValue: {
            getHelpLink: jasmine.createSpy('getHelpLink').and.returnValue('')
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WidgetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
