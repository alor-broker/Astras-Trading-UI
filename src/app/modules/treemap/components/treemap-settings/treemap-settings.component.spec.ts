import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TreemapSettingsComponent} from './treemap-settings.component';
import {NzSliderComponent} from "ng-zorro-antd/slider";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from 'src/app/shared/utils/testing/translocoTestsModule';
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {MockComponents} from "ng-mocks";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('TreemapSettingsComponent', () => {
  let component: TreemapSettingsComponent;
  let fixture: ComponentFixture<TreemapSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TreemapSettingsComponent,
        TranslocoTestsModule.getModule(),
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
    fixture = TestBed.createComponent(TreemapSettingsComponent);
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
