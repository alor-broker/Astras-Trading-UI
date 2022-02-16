import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { InstrumentAdditions } from '../../models/instrument-additions.model';
import { InstrumentSelect } from '../../models/instrument-select.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

@Component({
  selector: 'ats-instrument-select[shouldShowSettings][guid]',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less'],
  providers: [WatchInstrumentsService]
})
export class InstrumentSelectComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  filteredInstruments$: Observable<InstrumentSelect[]> = of([])
  selectedInstrument$: Observable<InstrumentAdditions | null> =  of(null)

  inputValue?: string;
  filteredOptions: string[] = [];
  constructor(private service: InstrumentsService, private sync: SyncService, private watcher: WatchInstrumentsService) {

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
      }
    } else {
      filter = {
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : '',
        limit: 10
      }
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: InstrumentSelect) {
    if (event.isUserInput) {
      this.sync.selectNewInstrument(val);
    }
  }

  ngOnInit(): void {
    this.filteredInstruments$ = this.filter$.pipe(
      filter((f) : f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.service.getInstruments(filter))
    )
    this.selectedInstrument$ = this.sync.selectedInstrument$.pipe(
      switchMap(i => {
        return this.service.getInstruments({
          query: i.symbol,
          exchange: i.exchange,
          instrumentGroup: i.instrumentGroup ?? '',
          limit: 1
        }).pipe(map(resp => resp[0]))
      }),
      map((val) : InstrumentAdditions => ({
        ...val,
        fullName: val.description
      }))
    );
  }

  ngOnDestroy(): void {
    this.watcher.unsubscribe();
  }

  watch(inst: Instrument) {
    this.watcher.add(inst);
  }
}
