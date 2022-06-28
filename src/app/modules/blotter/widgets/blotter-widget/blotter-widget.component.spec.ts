import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CurrencyInstrument } from 'src/app/shared/models/enums/currencies.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';

import { BlotterWidgetComponent } from './blotter-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";

const settings: BlotterSettings = {
  exchange: 'MOEX',
  portfolio: 'D39004',
  guid: '1230',
  ordersColumns: ['ticker'],
  stopOrdersColumns: ['ticker'],
  tradesColumns: ['ticker'],
  positionsColumns: ['ticker'],
  activeTabIndex: 0,
  currency: CurrencyInstrument.RUB,
  isSoldPositionsHidden: false
};

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  let widgetSettingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    widgetSettingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['updateIsLinked', 'getSettings', 'updateSettings']);
    widgetSettingsServiceSpy.getSettings.and.returnValue(of({ activeTabIndex: 0 } as BlotterSettings));

    await TestBed.configureTestingModule({
      declarations: [BlotterWidgetComponent],
      imports: []
    }).compileComponents();

    TestBed.overrideComponent(BlotterWidgetComponent, {
      set: {
        providers: [
          { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
