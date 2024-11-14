import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookWidgetComponent } from './scalper-order-book-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('ScalperOrderBookWidgetComponent', () => {
  let component: ScalperOrderBookWidgetComponent;
  let fixture: ComponentFixture<ScalperOrderBookWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-scalper-order-book',
          inputs: ['guid', 'isActive']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-scalper-order-book-settings',
          inputs: ['guid']
        }),
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
            terminalSettingsService: of({})
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookWidgetComponent);
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
