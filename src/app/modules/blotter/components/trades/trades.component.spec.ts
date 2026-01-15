import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BlotterService} from '../../services/blotter.service';
import {MockServiceBlotter} from '../../utils/mock-blotter-service';

import {TradesComponent} from './trades.component';
import {TimezoneConverterService} from '../../../../shared/services/timezone-converter.service';
import {EMPTY, Observable, of} from 'rxjs';
import {TimezoneConverter} from '../../../../shared/utils/timezone-converter';
import {TimezoneDisplayOption} from '../../../../shared/models/enums/timezone-display-option';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {
  NzFilterTriggerComponent,
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzThAddOnComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {
  InstrumentBadgeDisplayComponent
} from "../../../../shared/components/instrument-badge-display/instrument-badge-display.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  TableSearchFilterComponent
} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {GuidGenerator} from "../../../../shared/utils/guid";

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
      imports: [
        TradesComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzEmptyComponent,
          NzTableComponent,
          NzTheadComponent,
          NzThAddOnComponent,
          NzFilterTriggerComponent,
          NzTbodyComponent,
          InstrumentBadgeDisplayComponent,
          NzButtonComponent,
          NzDropdownMenuComponent,
          TableSearchFilterComponent,
          AddToWatchlistMenuComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzPopconfirmDirective,
          ResizeColumnDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzTableVirtualScrollDirective,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))}
        },
        {provide: BlotterService, useClass: MockServiceBlotter},
        {provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy},
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
        },
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: (): Observable<never> => EMPTY,
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
