import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

import { WatchlistTableComponent } from './watchlist-table.component';

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

  const spySync = jasmine.createSpyObj('SyncService', ['selectNewInstrument'])
  spySync.selectedInstrument$ = of(null);

  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched'])
  spyWatcher.getWatched.and.returnValue(of([]));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WatchlistTableComponent ],
      providers: [
        { provide: SyncService, useValue: spySync },
        { provide: WatchInstrumentsService, useValue: spyWatcher },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
