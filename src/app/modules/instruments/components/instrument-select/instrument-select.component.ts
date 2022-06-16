import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import { BehaviorSubject, Observable, of, take } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { InstrumentAdditions } from '../../models/instrument-additions.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { selectNewInstrument } from '../../../../store/instruments/instruments.actions';
import { getSelectedInstrument } from '../../../../store/instruments/instruments.selectors';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';

@Component({
  selector: 'ats-instrument-select[shouldShowSettings][guid]',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less']
})
export class InstrumentSelectComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  filteredInstruments$: Observable<Instrument[]> = of([]);
  selectedInstrument$: Observable<InstrumentAdditions | null> = of(null);
  inputValue?: string;
  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  constructor(
    private readonly service: InstrumentsService,
    private readonly store: Store,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService) {

  }

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
    }
    else {
      filter = {
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : '',
        limit: 20
      };
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: Instrument) {
    if (event.isUserInput) {
      this.store.dispatch(selectNewInstrument({ instrument: val }));
    }
  }

  ngOnInit(): void {
    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.service.getInstruments(filter))
    );

    this.selectedInstrument$ = this.store.pipe(
      select(getSelectedInstrument),
      map((val) => {
        return !!val
          ? {
            ...val,
            fullName: val.description
          }
          : null;
      })
    );

    this.setDefaultWatchList();
  }

  watch(inst: InstrumentKey) {
    this.watchInstrumentsService.getSettings(this.guid).pipe(
      map(s => s.activeListId),
      filter((id): id is string => !!id),
      take(1)
    ).subscribe(activeListId => {
      this.watchlistCollectionService.addItemsToList(activeListId, [inst]);
    });
  }

  private setDefaultWatchList() {
    this.watchInstrumentsService.getSettings(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      if (!!settings.activeListId) {
        return;
      }

      const collection = this.watchlistCollectionService.getWatchlistCollection();
      const defaultList = collection.collection.find(x => x.isDefault);
      if (defaultList) {
        this.watchInstrumentsService.setSettings({
          ...settings,
          activeListId: defaultList.id
        });
      }
    });
  }
}
