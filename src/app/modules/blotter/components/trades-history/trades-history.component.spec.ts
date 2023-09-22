import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesHistoryComponent } from './trades-history.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  of,
  Subject
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { MockServiceBlotter } from "../../utils/mock-blotter-service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";

describe('TradesHistoryComponent', () => {
  let component: TradesHistoryComponent;
  let fixture: ComponentFixture<TradesHistoryComponent>;

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        TradesHistoryComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        }
      ],
    });
    fixture = TestBed.createComponent(TradesHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
