import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { InstrumentSelectComponent } from './instrument-select.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { BehaviorSubject } from 'rxjs';
import { InstrumentSelectSettings } from '../../../../shared/models/settings/instrument-select-settings.model';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['getSettings']);
  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['addItemsToList']);

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);
  spyWatcher.getSettings.and.returnValue(getSettingsMock.asObservable());

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [InstrumentSelectComponent],
      providers: [
        { provide: InstrumentsService, useValue: spyInstrs },
        { provide: WatchInstrumentsService, useValue: spyWatcher },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
      ]
    }).compileComponents();

  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
