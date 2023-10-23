import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExportWatchlistDialogComponent } from './export-watchlist-dialog.component';
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Subject } from "rxjs";
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";

describe('ExportWatchlistDialogComponent', () => {
  let component: ExportWatchlistDialogComponent;
  let fixture: ComponentFixture<ExportWatchlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        ExportWatchlistDialogComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WatchlistCollectionService,
          useValue: {
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue(new Subject())
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ExportWatchlistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
