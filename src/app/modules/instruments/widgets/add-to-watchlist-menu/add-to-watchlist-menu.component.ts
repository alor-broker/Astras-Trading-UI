import {Component, ElementRef, input, model, OnInit, ViewChild} from '@angular/core';
import {combineLatest, Observable, take} from "rxjs";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {map} from "rxjs/operators";
import {WatchlistType} from "../../models/watchlist.model";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzMenuDirective, NzMenuItemComponent, NzSubMenuComponent} from 'ng-zorro-antd/menu';
import {NzModalComponent, NzModalContentDirective} from 'ng-zorro-antd/modal';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';

interface MenuItem {
  title: string;
  itemId?: string;
  subItems: MenuItem[];
  selectItem: (item: MenuItem) => void;
}

@Component({
  selector: 'ats-add-to-watchlist-menu',
  templateUrl: './add-to-watchlist-menu.component.html',
  styleUrl: './add-to-watchlist-menu.component.less',
  imports: [
    TranslocoDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzSubMenuComponent,
    NzModalComponent,
    NzModalContentDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzInputDirective,
    NzButtonComponent,
    NzIconDirective,
    AsyncPipe
  ]
})
export class AddToWatchlistMenuComponent implements OnInit {
  menuItems$!: Observable<MenuItem[]>;

  showNewListDialog = false;

  readonly itemToAdd = model<InstrumentKey | null>(null);

  readonly allowAddToNewList = input(true);

  @ViewChild(NzDropdownMenuComponent)
  menuRef: NzDropdownMenuComponent | null = null;

  @ViewChild('titleInput')
  titleInputEl?: ElementRef<HTMLInputElement>;

  readonly newListForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control(
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    )
  });

  constructor(
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly translatorService: TranslatorService,
    private readonly formBuilder: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.menuItems$ = this.getMenuItems();
  }

  selectItem(item: MenuItem): void {
    const itemToAdd = this.itemToAdd();
    if (item.itemId == null || itemToAdd == null) {
      return;
    }

    this.watchlistCollectionService.addItemsToList(item.itemId, [itemToAdd]);
  }

  addItemToNewList(): void {
    if (!this.newListForm.valid) {
      return;
    }

    const itemToAdd = this.itemToAdd();

    if (itemToAdd == null) {
      return;
    }

    const newListTitle = this.newListForm.value.title!;

    this.watchlistCollectionService.getWatchlistCollection().pipe(
      take(1)
    ).subscribe(collection => {
      const existing = collection.collection.find(c => c.title === newListTitle);

      if (existing != null) {
        this.newListForm.controls.title.setErrors({
          existing: true
        });

        return;
      }

      this.watchlistCollectionService.createNewList(
        newListTitle,
        [
          itemToAdd
        ]
      );

      this.showNewListDialog = false;
    });
  }

  afterNewListDialogOpen(): void {
    setTimeout(() => {
      this.titleInputEl?.nativeElement.focus();
    });
  }

  private getMenuItems(): Observable<MenuItem[]> {
    return combineLatest({
      watchlistCollection: this.watchlistCollectionService.getWatchlistCollection(),
      translator: this.translatorService.getTranslator('instruments/add-to-watchlist-menu')
    }).pipe(
      map(x => {
        const availableWatchlists = x.watchlistCollection.collection.filter(c => c.type != WatchlistType.HistoryList);

        if (availableWatchlists.length === 0) {
          return [];
        }

        const menu: MenuItem[] = [];

        if (availableWatchlists.length === 1) {
          menu.push({
            title: x.translator(['addToList']),
            itemId: availableWatchlists[0].id,
            selectItem: item => this.selectItem(item),
            subItems: []
          });
        } else {
          menu.push({
            title: x.translator(['addToList']),
            selectItem: (): void => {
            },
            subItems: availableWatchlists
              .map(list => ({
                  title: list.title,
                  itemId: list.id,
                  selectItem: (item): void => this.selectItem(item),
                  subItems: []
                })
              )
          });
        }

        if (this.allowAddToNewList()) {
          menu.push({
            title: x.translator(['addToNewList']),
            selectItem: () => {
              this.newListForm.reset();
              this.showNewListDialog = true;
            },
            subItems: []
          });
        }

        return menu;
      })
    );
  }
}
