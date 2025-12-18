import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WatchlistCollectionEditComponent} from './watchlist-collection-edit.component';
import {WatchlistCollectionService} from '../../services/watchlist-collection.service';
import {of, Subject} from 'rxjs';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {
  NzListComponent,
  NzListEmptyComponent,
  NzListItemActionComponent,
  NzListItemActionsComponent,
  NzListItemComponent
} from "ng-zorro-antd/list";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {ExportWatchlistDialogComponent} from "../export-watchlist-dialog/export-watchlist-dialog.component";
import {ImportWatchlistDialogComponent} from "../import-watchlist-dialog/import-watchlist-dialog.component";

describe('WatchlistCollectionEditComponent', () => {
  let component: WatchlistCollectionEditComponent;
  let fixture: ComponentFixture<WatchlistCollectionEditComponent>;
  const watchlistCollectionServiceSpy = jasmine.createSpyObj(
    'WatchlistCollectionService',
    [
      'collectionChanged$',
      'getWatchlistCollection',
      'updateListMeta',
      'createNewList',
      'removeList',
      'getPresetCollection'
    ]);

  const collectionChangedMock = new Subject();
  watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
  watchlistCollectionServiceSpy.getPresetCollection.and.returnValue(of(null));
  watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        WatchlistCollectionEditComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzListComponent,
          NzListItemComponent,
          NzListItemActionsComponent,
          NzListItemActionComponent,
          NzButtonComponent,
          NzTypographyComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent,
          NzListEmptyComponent,
          ExportWatchlistDialogComponent,
          ImportWatchlistDialogComponent
        ),
        MockDirectives(
          NzTooltipDirective,
          NzIconDirective,
          NzPopconfirmDirective,
          NzDropdownButtonDirective,
          NzDropDownDirective,
          NzMenuDirective
        )
      ],
      providers: [
        {provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy}
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistCollectionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
