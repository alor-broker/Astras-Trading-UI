import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AddToWatchlistMenuComponent} from './add-to-watchlist-menu.component';
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {Subject} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent} from "ng-zorro-antd/menu";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('AddToWatchlistMenuComponent', () => {
  let component: AddToWatchlistMenuComponent;
  let fixture: ComponentFixture<AddToWatchlistMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        AddToWatchlistMenuComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzDropdownMenuComponent,
          NzMenuItemComponent,
          NzSubMenuComponent,
          NzModalComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzMenuDirective,
          NzModalContentDirective,
          NzIconDirective
        )
      ],
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
