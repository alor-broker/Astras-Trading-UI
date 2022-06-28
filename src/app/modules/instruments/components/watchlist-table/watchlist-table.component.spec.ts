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
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { InstrumentSelectSettings } from '../../../../shared/models/settings/instrument-select-settings.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  const spySync = jasmine.createSpyObj('SyncService', ['selectNewInstrument']);
  spySync.selectedInstrument$ = of(null);

  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched']);
  spyWatcher.getWatched.and.returnValue(of([]));
  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);

  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['removeItemsFromList']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [WatchlistTableComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(getSettingsMock) }
        },
        { provide: WatchInstrumentsService, useValue: spyWatcher },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy }
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
