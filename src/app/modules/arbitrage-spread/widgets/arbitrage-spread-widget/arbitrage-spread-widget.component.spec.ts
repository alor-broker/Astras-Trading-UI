import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadWidgetComponent } from './arbitrage-spread-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { mockComponent, widgetSkeletonMock } from "../../../../shared/utils/testing";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('ArbitrageSpreadWidgetComponent', () => {
  let component: ArbitrageSpreadWidgetComponent;
  let fixture: ComponentFixture<ArbitrageSpreadWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ArbitrageSpreadWidgetComponent,
        mockComponent({
          selector: 'ats-arbitrage-spread',
          inputs: ['guid']
        }),
        mockComponent({selector: 'ats-arbitrage-spread-modal-widget'}),
        widgetSkeletonMock
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadWidgetComponent);
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
