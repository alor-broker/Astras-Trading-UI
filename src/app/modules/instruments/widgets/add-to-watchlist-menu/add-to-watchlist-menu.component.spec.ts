import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToWatchlistMenuComponent } from './add-to-watchlist-menu.component';
import { getTranslocoModule } from "../../../../shared/utils/testing";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Subject } from "rxjs";

describe('AddToWatchlistMenuComponent', () => {
  let component: AddToWatchlistMenuComponent;
  let fixture: ComponentFixture<AddToWatchlistMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
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
