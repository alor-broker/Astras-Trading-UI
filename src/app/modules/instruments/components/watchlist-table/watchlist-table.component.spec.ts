import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BehaviorSubject, EMPTY, of, Subject} from 'rxjs';
import {WatchInstrumentsService} from '../../services/watch-instruments.service';
import {WatchlistTableComponent} from './watchlist-table.component';
import {WatchlistCollectionService} from '../../services/watchlist-collection.service';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {InstrumentSelectSettings} from '../../models/instrument-select-settings.model';
import {LetDirective} from "@ngrx/component";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzTdAddOnComponent,
  NzThAddOnComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {
  InstrumentBadgeDisplayComponent
} from "../../../../shared/components/instrument-badge-display/instrument-badge-display.component";
import {PriceDiffComponent} from "../../../../shared/components/price-diff/price-diff.component";
import {ShortNumberComponent} from "../../../../shared/components/short-number/short-number.component";
import {NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent} from "ng-zorro-antd/menu";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  let watchInstrumentsServiceSpy: any;
  let watchlistCollectionServiceSpy: any;

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    watchInstrumentsServiceSpy = jasmine.createSpyObj('WatchInstrumentsService', ['subscribeToListUpdates', 'unsubscribeFromList', 'clearSubscriptions']);
    watchInstrumentsServiceSpy.subscribeToListUpdates.and.returnValue(of([]));

    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['removeItemsFromList', 'getWatchlistCollection']);

    watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(new Subject());
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzTableComponent,
          NzTheadComponent,
          NzThAddOnComponent,
          NzTbodyComponent,
          NzTdAddOnComponent,
          InstrumentBadgeDisplayComponent,
          PriceDiffComponent,
          ShortNumberComponent,
          NzDropdownMenuComponent,
          NzSubMenuComponent,
          NzMenuItemComponent,
          NzTypographyComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzTooltipDirective,
          NzIconDirective,
          ResizeColumnDirective,
          NzTableVirtualScrollDirective,
          NzMenuDirective,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock)}
        },
        {
          provide: WatchInstrumentsService,
          useValue: watchInstrumentsServiceSpy
        },
        {
          provide: WatchlistCollectionService,
          useValue: watchlistCollectionServiceSpy
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            addWidget: jasmine.createSpy('addWidget').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: EMPTY
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getLangChanges: jasmine.createSpy('getLangChanges').and.returnValue(new Subject())
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: WidgetsMetaService,
          useValue: {
            getWidgetsMeta: jasmine.createSpy('getWidgetsMeta').and.returnValue(EMPTY)
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
