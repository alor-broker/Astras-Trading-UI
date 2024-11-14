import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreemapWidgetComponent } from './treemap-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";

describe('TreemapWidgetComponent', () => {
  let component: TreemapWidgetComponent;
  let fixture: ComponentFixture<TreemapWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TreemapWidgetComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-treemap', inputs: ['guid'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-treemap-settings', inputs: ['guid'] }),
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
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreemapWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
