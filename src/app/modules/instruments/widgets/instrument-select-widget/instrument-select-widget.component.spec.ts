import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSelectWidgetComponent } from './instrument-select-widget.component';
import {getTranslocoModule, mockComponent, widgetSkeletonMock} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('InstrumentSelectWidgetComponent', () => {
  let component: InstrumentSelectWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        InstrumentSelectWidgetComponent,
        mockComponent({
          selector: 'ats-instrument-select',
          inputs: ['guid']
        }),
        mockComponent({
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
