import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistTableComponent } from './watchlist-table.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  const spySync = jasmine.createSpyObj('SyncService', ['selectNewInstrument']);
  spySync.selectedInstrument$ = of(null);

  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched']);
  spyWatcher.getWatched.and.returnValue(of([]));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [WatchlistTableComponent],
      providers: [
        { provide: WatchInstrumentsService, useValue: spyWatcher },
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
