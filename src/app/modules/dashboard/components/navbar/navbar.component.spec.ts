import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';
import {
  of,
  Subject
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from "@ngrx/store";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { RouterModule } from "@angular/router";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { HelpService } from "../../../../shared/services/help.service";

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  const spyDashboard = jasmine.createSpyObj('DashboardService', ['clearDashboard', 'addWidget']);
  const spyAuth = jasmine.createSpyObj('AuthService', ['logout']);
  const spyModal = jasmine.createSpyObj('ModalService', ['openTerminalSettingsModal', 'openCommandModal']);
  const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings', 'getLangChanges']);
  themeServiceSpy.getThemeSettings.and.returnValue(of({
    theme: ThemeType.dark,
    themeColors: {
      sellColor: 'rgba(239,83,80, 1)',
      sellColorBackground: 'rgba(184, 27, 68, 0.4)',
      buyColor: 'rgba(12, 179, 130, 1',
      buyColorBackground: 'rgba(12, 179, 130, 0.4)',
      componentBackground: '#141414',
      primaryColor: '#177ddc',
      purpleColor: '#51258f',
      errorColor: '#a61d24'
    } as ThemeColors
  } as ThemeSettings));

  themeServiceSpy.getLangChanges.and.returnValue(of("ru"));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NavbarComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-widget-menu', inputs: ['showResetItem'] }),
        mockComponent({ selector: 'ats-notification-button' }),
        mockComponent({ selector: 'ats-select-dashboard-menu', inputs: ['visibilityChange']}),
        mockComponent({ selector: 'ats-network-indicator'}),
        mockComponent({ selector: 'ats-dashboards-panel', inputs: ['selectedDashboard'] }),
        mockComponent({ selector: 'ats-widgets-gallery', inputs: ['gallery', 'atsVisible'] }),
        mockComponent({ selector: 'ats-side-chat-widget', inputs: ['atsVisible'] })
      ],
      providers: [
        { provide: ManageDashboardsService, useValue: spyDashboard },
        { provide: AuthService, useValue: spyAuth },
        { provide: ModalService, useValue: spyModal },
        {
          provide: Store,
          useValue: {
            select: jasmine.createSpy('select').and.returnValue(of({})),
            dispatch: jasmine.createSpy('dispatch').and.callThrough()
          }
        },
        { provide: ThemeService, useValue: themeServiceSpy },
        {
          provide: OrdersDialogService,
          useValue: {
            openNewOrderDialog: jasmine.createSpy('openNewOrderDialog').and.callThrough()
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              reports: '',
              releases: '',
              support: '',
              help: ''
            }
          }
        },
        {
          provide: WidgetsMetaService,
          useValue: {
            getWidgetsMeta: jasmine.createSpy('getWidgetsMeta').and.returnValue(new Subject())
          }
        },
        {
          provide: HelpService,
          useValue: {
            getHelpLink: jasmine.createSpy('getHelpLink').and.returnValue('')
          }
        }
      ],
      imports: [
        NoopAnimationsModule,
        RouterModule.forRoot([]),
        NzSelectModule,
        FormsModule,
        getTranslocoModule()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
