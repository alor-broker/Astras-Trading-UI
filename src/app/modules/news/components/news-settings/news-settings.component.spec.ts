import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NewsSettingsComponent} from './news-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {MockComponents} from "ng-mocks";
import {NzSliderComponent} from "ng-zorro-antd/slider";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('NewsSettingsComponent', () => {
  let component: NewsSettingsComponent;
  let fixture: ComponentFixture<NewsSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        NewsSettingsComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          WidgetSettingsComponent,
          NzSliderComponent
        )
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
    });
    fixture = TestBed.createComponent(NewsSettingsComponent);
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
