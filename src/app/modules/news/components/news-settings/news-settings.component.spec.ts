import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsSettingsComponent } from './news-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { NzSliderModule } from "ng-zorro-antd/slider";

describe('NewsSettingsComponent', () => {
  let component: NewsSettingsComponent;
  let fixture: ComponentFixture<NewsSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        NzSliderModule,
        ...sharedModuleImportForTests
      ],
      declarations: [NewsSettingsComponent],
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
