import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreemapWidgetComponent } from './treemap-widget.component';
import {
  commonTestProviders,
  mockComponent,
  sharedModuleImportForTests,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";

describe('TreemapWidgetComponent', () => {
  let component: TreemapWidgetComponent;
  let fixture: ComponentFixture<TreemapWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TreemapWidgetComponent,
        mockComponent({ selector: 'ats-treemap', inputs: ['guid'] }),
        widgetSkeletonMock
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
        ...commonTestProviders
      ],
      imports: [...sharedModuleImportForTests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreemapWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
