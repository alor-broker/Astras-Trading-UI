import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSelectWidgetComponent } from './instrument-select-widget.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { widgetSkeletonMock } from "../../../../shared/utils/testing/widget-skeleton-mock";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('InstrumentSelectWidgetComponent', () => {
  let component: InstrumentSelectWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        InstrumentSelectWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-instrument-select',
          inputs: ['guid']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-instrument-select-settings',
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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectWidgetComponent);
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

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
