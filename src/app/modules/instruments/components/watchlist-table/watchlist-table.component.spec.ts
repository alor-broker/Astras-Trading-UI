import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  BehaviorSubject,
  of
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

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  let watchInstrumentsServiceSpy: any;
  let watchlistCollectionServiceSpy: any;

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    watchInstrumentsServiceSpy = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched', 'unsubscribe']);
    watchInstrumentsServiceSpy.getWatched.and.returnValue(of([]));

    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['removeItemsFromList']);
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      declarations: [WatchlistTableComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock) }
        },
        { provide: WatchInstrumentsService, useValue: watchInstrumentsServiceSpy },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
