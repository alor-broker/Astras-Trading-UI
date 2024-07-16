import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { TradesComponent } from './trades.component';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { of } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { mockComponent, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";

describe('TradesComponent', () => {
  let component: TradesComponent;
  let fixture: ComponentFixture<TradesComponent>;
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        }
      ],
      declarations: [
        TradesComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradesComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
