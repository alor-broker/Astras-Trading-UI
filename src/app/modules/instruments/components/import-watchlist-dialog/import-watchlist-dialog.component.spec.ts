import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ImportWatchlistDialogComponent } from './import-watchlist-dialog.component';
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Subject } from "rxjs";
import { MarketService } from "../../../../shared/services/market.service";
import { InstrumentsService } from "../../services/instruments.service";
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('ImportWatchlistDialogComponent', () => {
  let component: ImportWatchlistDialogComponent;
  let fixture: ComponentFixture<ImportWatchlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        ImportWatchlistDialogComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: MarketService,
          useValue: {
            getDefaultExchange: jasmine.createSpy('getDefaultExchange').and.returnValue(new Subject())
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: WatchlistCollectionService,
          useValue: {
            addItemsToList: jasmine.createSpy('addItemsToList').and.callThrough()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(ImportWatchlistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
