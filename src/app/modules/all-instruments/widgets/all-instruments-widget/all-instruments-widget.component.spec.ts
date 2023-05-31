import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AllInstrumentsWidgetComponent} from './all-instruments-widget.component';
import {mockComponent, widgetSkeletonMock} from "../../../../shared/utils/testing";
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {of} from 'rxjs';
import {TerminalSettingsService} from '../../../terminal-settings/services/terminal-settings.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('AllInstrumentsWidgetComponent', () => {
  let component: AllInstrumentsWidgetComponent;
  let fixture: ComponentFixture<AllInstrumentsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsWidgetComponent,
        mockComponent({
          selector: 'ats-all-instruments',
          inputs: ['guid']
        }),
        mockComponent({
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
