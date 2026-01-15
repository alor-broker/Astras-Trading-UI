import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BlotterSettingsComponent} from './blotter-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {PortfoliosFeature} from "../../../../store/portfolios/portfolios.reducer";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {RemoveSelectTitlesDirective} from "../../../../shared/directives/remove-select-titles.directive";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";
import {MockComponents, MockDirectives} from "ng-mocks";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('BlotterSettingsComponent', () => {
  let component: BlotterSettingsComponent;
  let fixture: ComponentFixture<BlotterSettingsComponent>;
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
        ),
        MockDirectives(
          NzTooltipDirective,
          RemoveSelectTitlesDirective
        ),
        BlotterSettingsComponent,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        {
          provide: PUSH_NOTIFICATIONS_CONFIG,
          useValue: {
            priceChangeNotifications: {
              isSupported: true
            },
            portfolioOrdersExecuteNotifications: {
              isSupported: true
            }
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
