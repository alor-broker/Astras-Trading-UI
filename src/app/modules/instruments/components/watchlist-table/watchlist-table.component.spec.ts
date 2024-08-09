import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  BehaviorSubject,
  of,
  Subject
} from 'rxjs';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistTableComponent } from './watchlist-table.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { LetDirective } from "@ngrx/component";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  let watchInstrumentsServiceSpy: any;
  let watchlistCollectionServiceSpy: any;

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    watchInstrumentsServiceSpy = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched', 'clear']);
    watchInstrumentsServiceSpy.getWatched.and.returnValue(of([]));

    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['removeItemsFromList', 'getWatchlistCollection']);

    watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(new Subject());
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        LetDirective,
        getTranslocoModule()
      ],
      declarations: [
        WatchlistTableComponent,
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock) }
        },
        { provide: WatchInstrumentsService, useValue: watchInstrumentsServiceSpy },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
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
