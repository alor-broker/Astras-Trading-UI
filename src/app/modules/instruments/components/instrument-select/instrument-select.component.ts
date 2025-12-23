import { ChangeDetectionStrategy, Component, ElementRef, OnInit, input, viewChild, inject } from '@angular/core';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective,
  NzOptionSelectionChange
} from 'ng-zorro-antd/auto-complete';
import {BehaviorSubject, combineLatest, Observable, of, shareReplay, take,} from 'rxjs';
import {debounceTime, filter, switchMap} from 'rxjs/operators';
import {Instrument} from 'src/app/shared/models/instruments/instrument.model';
import {SearchFilter} from '../../models/search-filter.model';
import {InstrumentsService} from '../../services/instruments.service';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {WatchlistCollectionService} from '../../services/watchlist-collection.service';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WatchlistCollection} from '../../models/watchlist.model';
import {InstrumentSelectSettings, WatchlistMeta} from '../../models/instrument-select-settings.model';
import {WatchListTitleHelper} from "../../utils/watch-list-title.helper";
import {ACTIONS_CONTEXT, ActionsContext} from 'src/app/shared/services/actions-context';
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {WatchInstrumentsService} from "../../services/watch-instruments.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzMenuDirective, NzMenuItemComponent} from 'ng-zorro-antd/menu';
import {WatchlistTableComponent} from '../watchlist-table/watchlist-table.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-instrument-select',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoDirective,
    NzInputDirective,
    FormsModule,
    NzAutocompleteTriggerDirective,
    NzAutocompleteComponent,
    NzAutocompleteOptionComponent,
    NzTagComponent,
    NzButtonComponent,
    NzDropdownButtonDirective,
    NzDropDownDirective,
    NzTooltipDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    WatchlistTableComponent,
    AsyncPipe
  ]
})
export class InstrumentSelectComponent implements OnInit {
  private readonly service = inject(InstrumentsService);
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly watchInstrumentsService = inject(WatchInstrumentsService);
  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);

  readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly guid = input.required<string>();

  filteredInstruments$: Observable<Instrument[]> = of([]);
  inputValue?: string;
  collection$!: Observable<WatchlistCollection>;
  settings$!: Observable<InstrumentSelectSettings>;
  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  private readonly filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  onChange(value: string): void {
    const existing = this.filter$.getValue();
    let exchange = 'MOEX';
    let query = '';
    let instrumentGroup = '';
    let filter: SearchFilter;

    const isComplexSearch = value.includes(':');
    if (isComplexSearch) {
      const parts = value.split(':');
      exchange = parts[0].toUpperCase();
      query = parts[1];
      instrumentGroup = parts[2]?.toUpperCase() ?? '';
    }
    if (existing) {
      filter = {
        ...existing,
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : ''
      };
    } else {
      filter = {
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : '',
        limit: 20
      };
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: Instrument): void {
    if (event.isUserInput) {
      this.watch(val);
      setTimeout(() => {
        this.inputEl().nativeElement.value = '';
        this.inputEl().nativeElement.blur();
      }, 0);
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid()).pipe(
      shareReplay(1)
    );

    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.service.getInstruments(filter))
    );

    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay(1)
    );

    this.setDefaultWatchList();
  }

  watch(instrument: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if ((settings.activeWatchlistMetas?.length ?? 0) === 0) {
        return;
      }

      this.watchlistCollectionService.addItemsToList(settings.activeWatchlistMetas![0].id, [instrument]);
      this.actionsContext.selectInstrument(instrument, settings.badgeColor ?? defaultBadgeColor);
    });
  }

  selectCollection(listId: string): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(settings => {
        const isRemoveWatchlist = (settings.activeWatchlistMetas ?? [])
          .map(wm => wm.id)
          .includes(listId);

        if (isRemoveWatchlist) {
          this.watchInstrumentsService.unsubscribeFromList(listId);

          this.settingsService.updateSettings<InstrumentSelectSettings>(
            this.guid(),
            {
              activeWatchlistMetas: settings.activeWatchlistMetas?.filter((meta) => meta.id !== listId) ?? []
            }
          );
        } else {
          this.settingsService.updateSettings<InstrumentSelectSettings>(
            this.guid(),
            {
              activeWatchlistMetas: [{id: listId, isExpanded: true}, ...(settings.activeWatchlistMetas ?? [])]
            }
          );
        }
      });
  }

  isSelectedWatchlist(listId: string, activeLists: WatchlistMeta[]): boolean {
    return activeLists
      .map(l => l.id)
      .includes(listId);
  }

  getAutocompleteLeftPosition(): string {
    const autocompleteEl = document.querySelector('.instrument-select-autocomplete')?.parentElement;

    if (!autocompleteEl) {
      return '0px';
    }

    const autocompleteRect = autocompleteEl.getBoundingClientRect();

    return `${Math.min(window.innerWidth - autocompleteRect.right, 0)}px`;
  }

  getAutocompleteWidth(input: HTMLInputElement): number {
    const inputWidth = input.getBoundingClientRect().width;
    return Math.max(250, inputWidth);
  }

  private setDefaultWatchList(): void {
    combineLatest([
        this.settings$,
        this.collection$
      ]
    ).pipe(
      take(1)
    ).subscribe(([settings, collection]) => {
      if (settings.activeWatchlistMetas != null) {
        if (collection.collection.find(w => settings.activeWatchlistMetas!.map(wm => wm.id).includes(w.id))) {
          return;
        }
      }

      const defaultList = collection.collection.find(x => x.isDefault ?? false);

      if (defaultList) {
        this.settingsService.updateSettings<InstrumentSelectSettings>(this.guid(), {
          activeWatchlistMetas: [{
            id: defaultList.id,
            isExpanded: true
          }]
        });
      }
    });
  }
}
