import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSelectSettingsComponent } from './instrument-select-settings.component';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { InstrumentSelectSettings } from '../../../../shared/models/settings/instrument-select-settings.model';

describe('InstrumentSelectSettingsComponent', () => {
  let component: InstrumentSelectSettingsComponent;
  let fixture: ComponentFixture<InstrumentSelectSettingsComponent>;

  const watchInstrumentsServiceSpy = jasmine.createSpyObj('WatchInstrumentsService', ['getSettings']);
  const watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['collectionChanged$', 'getWatchlistCollection']);

  const collectionChangedMock = new Subject();
  watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();

  const getSettingsMock = new BehaviorSubject({} as InstrumentSelectSettings);
  watchInstrumentsServiceSpy.getSettings.and.returnValue(getSettingsMock.asObservable());

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstrumentSelectSettingsComponent],
      providers: [
        { provide: WatchInstrumentsService, useValue: watchInstrumentsServiceSpy },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
