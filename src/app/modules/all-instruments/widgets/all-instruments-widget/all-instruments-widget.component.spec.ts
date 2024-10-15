import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllInstrumentsWidgetComponent } from './all-instruments-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";

describe('AllInstrumentsWidgetComponent', () => {
  let component: AllInstrumentsWidgetComponent;
  let fixture: ComponentFixture<AllInstrumentsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-all-instruments',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-all-instruments-settings',
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
    fixture = TestBed.createComponent(AllInstrumentsWidgetComponent);
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
