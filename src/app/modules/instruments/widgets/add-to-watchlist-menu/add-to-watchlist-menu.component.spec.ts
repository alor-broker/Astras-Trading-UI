import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToWatchlistMenuComponent } from './add-to-watchlist-menu.component';
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Subject } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('AddToWatchlistMenuComponent', () => {
  let component: AddToWatchlistMenuComponent;
  let fixture: ComponentFixture<AddToWatchlistMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        NzDropDownModule,
      ],
      declarations: [AddToWatchlistMenuComponent],
      providers: [
        {
          provide: WatchlistCollectionService,
          useValue: {
            getWatchlistCollection: jasmine.createSpy('getWatchlistCollection').and.returnValue(new Subject()),
            addItemsToList: jasmine.createSpy('addItemsToList').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddToWatchlistMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
