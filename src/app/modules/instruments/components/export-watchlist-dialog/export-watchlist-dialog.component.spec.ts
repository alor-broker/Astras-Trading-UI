import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ExportWatchlistDialogComponent} from './export-watchlist-dialog.component';
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {Subject} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('ExportWatchlistDialogComponent', () => {
  let component: ExportWatchlistDialogComponent;
  let fixture: ComponentFixture<ExportWatchlistDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        ExportWatchlistDialogComponent,
        MockComponents(
          NzModalComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzModalContentDirective,
          NzInputDirective,
          NzModalFooterDirective,
          NzTooltipDirective,
          NzIconDirective
        )
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
