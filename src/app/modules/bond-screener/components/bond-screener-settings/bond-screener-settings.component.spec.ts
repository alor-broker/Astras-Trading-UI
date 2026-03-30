import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BondScreenerSettingsComponent} from './bond-screener-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {MockComponents} from "ng-mocks";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('BondScreenerSettingsComponent', () => {
  let component: BondScreenerSettingsComponent;
  let fixture: ComponentFixture<BondScreenerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        BondScreenerSettingsComponent,
        MockComponents(
          WidgetSettingsComponent
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough()
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
          }
        },
        ...commonTestProviders
      ]
    });
    fixture = TestBed.createComponent(BondScreenerSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
