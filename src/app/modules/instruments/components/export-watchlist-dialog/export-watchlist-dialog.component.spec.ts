import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExportWatchlistDialogComponent } from './export-watchlist-dialog.component';
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Subject } from "rxjs";
import { LetDirective } from "@ngrx/component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('ExportWatchlistDialogComponent', () => {
  let component: ExportWatchlistDialogComponent;
  let fixture: ComponentFixture<ExportWatchlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
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
