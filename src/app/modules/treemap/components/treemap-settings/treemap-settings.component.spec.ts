import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TreemapSettingsComponent } from './treemap-settings.component';
import { NzSliderModule } from "ng-zorro-antd/slider";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TranslocoTestsModule } from 'src/app/shared/utils/testing/translocoTestsModule';
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { WidgetSettingsComponent } from "../../../../shared/components/widget-settings/widget-settings.component";

describe('TreemapSettingsComponent', () => {
  let component: TreemapSettingsComponent;
  let fixture: ComponentFixture<TreemapSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        NzSliderModule,
        WidgetSettingsComponent
      ],
      declarations: [
        TreemapSettingsComponent,
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
