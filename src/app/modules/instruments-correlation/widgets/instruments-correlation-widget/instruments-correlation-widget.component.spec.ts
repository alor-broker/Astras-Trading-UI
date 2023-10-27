import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentsCorrelationWidgetComponent } from './instruments-correlation-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";

describe('InstrumentsCorrelationWidgetComponent', () => {
  let component: InstrumentsCorrelationWidgetComponent;
  let fixture: ComponentFixture<InstrumentsCorrelationWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        InstrumentsCorrelationWidgetComponent,
        mockComponent({
          selector: 'ats-correlation-chart',
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
        }
      ]
    });
    fixture = TestBed.createComponent(InstrumentsCorrelationWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {
        widgetName: {
          translations: {}
        }
      } as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
