import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketTrendsSettingsComponent } from './market-trends-settings.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('MarketTrendsSettingsComponent', () => {
  let component: MarketTrendsSettingsComponent;
  let fixture: ComponentFixture<MarketTrendsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        WidgetSettingsComponent,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
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
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketTrendsSettingsComponent);
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
