import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesHistoryComponent } from './trades-history.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  EMPTY,
  Observable,
  of,
  Subject
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { MockServiceBlotter } from "../../utils/mock-blotter-service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { TradesHistoryService } from "../../../../shared/services/trades-history.service";
import { LetDirective } from "@ngrx/component";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";

describe('TradesHistoryComponent', () => {
  let component: TradesHistoryComponent;
  let fixture: ComponentFixture<TradesHistoryComponent>;

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        TradesHistoryComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
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
        },
        {
          provide: TradesHistoryService,
          useValue: {
            getTradesHistoryForPortfolio: jasmine.createSpy('getTradesHistoryForPortfolio').and.returnValue(new Subject())
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: (): Observable<never> => EMPTY,
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
      ],
    });
    fixture = TestBed.createComponent(TradesHistoryComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
