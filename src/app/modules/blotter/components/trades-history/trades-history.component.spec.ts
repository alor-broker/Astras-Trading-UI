import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TradesHistoryComponent} from './trades-history.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY, Observable, of, Subject} from "rxjs";
import {BlotterService} from "../../services/blotter.service";
import {MockServiceBlotter} from "../../utils/mock-blotter-service";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {TimezoneConverter} from "../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../shared/models/enums/timezone-display-option";
import {TradesHistoryService} from "../../../../shared/services/trades-history.service";
import {LetDirective} from "@ngrx/component";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
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
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('TradesHistoryComponent', () => {
  let component: TradesHistoryComponent;
  let fixture: ComponentFixture<TradesHistoryComponent>;

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        TradesHistoryComponent,
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
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())}
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
