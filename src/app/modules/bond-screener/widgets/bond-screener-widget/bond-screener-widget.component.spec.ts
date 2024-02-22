import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondScreenerWidgetComponent } from './bond-screener-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { mockComponent, widgetSkeletonMock } from "../../../../shared/utils/testing";
import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";

describe('BondScreenerWidgetComponent', () => {
  let component: BondScreenerWidgetComponent;
  let fixture: ComponentFixture<BondScreenerWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        BondScreenerWidgetComponent,
        mockComponent({
          selector: 'ats-bond-screener',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-bond-screener-settings',
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
        }
      ]
    });
    fixture = TestBed.createComponent(BondScreenerWidgetComponent);
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
