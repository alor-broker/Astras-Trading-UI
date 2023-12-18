import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExchangeRateWidgetComponent } from './exchange-rate-widget.component';
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";

describe('ExchangeRateWidgetComponent', () => {
  let component: ExchangeRateWidgetComponent;
  let fixture: ComponentFixture<ExchangeRateWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ExchangeRateWidgetComponent,
        mockComponent({
          selector: 'ats-exchange-rate',
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
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateWidgetComponent);
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
