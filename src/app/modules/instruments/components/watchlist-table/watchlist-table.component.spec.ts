import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  BehaviorSubject,
  EMPTY,
  of,
  Subject
} from 'rxjs';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistTableComponent } from './watchlist-table.component';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { LetDirective } from "@ngrx/component";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import {
  NzContextMenuServiceModule
} from "ng-zorro-antd/dropdown";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";

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
        NzContextMenuServiceModule
      ],
      declarations: [
        WatchlistTableComponent,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock) }
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
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
