import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { Column } from '../../models/column.model';
import { PositionFilter } from '../../models/position-filter.model';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-positions[shouldShowSettings][guid]',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less']
})
export class PositionsComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  tableInnerWidth = '1000px'

  private settingsSub? : Subscription;

  private positions$: Observable<Position[]> = of([]);
  displayPositions$: Observable<Position[]> = of([]);
  searchFilter = new BehaviorSubject<PositionFilter>({ });

  allColumns: Column<Position, PositionFilter>[] = [
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (position, filter) => filter.symbol ? position.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'shortName',
      name: 'Имя',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => a.shortName.localeCompare(b.shortName),
      searchDescription: 'Поиск по имени',
      searchFn: (position, filter) => filter.shortName ? position.shortName.toLowerCase().includes(filter.shortName.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'avgPrice',
      name: 'Средняя',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => Number(a.avgPrice) - Number(b.avgPrice),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'qtyT0',
      name: 'Кол-во Т0',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => Number(a.qtyT0) - Number(b.qtyT0),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'qtyT1',
      name: 'Кол-во Т1',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => Number(a.qtyT1) - Number(b.qtyT1),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'qtyT2',
      name: 'Кол-во Т2',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => Number(a.qtyT2) - Number(b.qtyT2),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'qtyTFuture',
      name: 'Кол-во ТFuture',
      sortOrder: null,
      sortFn: (a: Position, b: Position) => Number(a.qtyTFuture) - Number(b.qtyTFuture),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
  ]

  listOfColumns: Column<Position, PositionFilter>[] = [];

  constructor(private service: BlotterService) { }

  ngOnInit(): void {
    this.settingsSub = this.service.getSettings(this.guid).pipe(
      tap(s => {
        if (s.positionsColumns) {
          this.listOfColumns = this.allColumns.filter(c => s.positionsColumns.includes(c.id))
          this.tableInnerWidth = `${this.listOfColumns.length * 100}px`;
        }
      })
    ).subscribe();
    this.positions$ = this.service.getPositions(this.guid);
    this.displayPositions$ = this.positions$.pipe(
      mergeMap(positions => this.searchFilter.pipe(
        map(f => positions.filter(o => this.justifyFilter(o, f)))
      )),
    )
  }

  ngOnDestroy(): void {
    this.settingsSub?.unsubscribe();
  }

  reset(): void {
    this.searchFilter.next({ });
  }

  filterChange(text: string, option: string ) {
    const newFilter = this.searchFilter.getValue();
    if (option) {
      newFilter[option as keyof PositionFilter] = text;
      this.searchFilter.next(newFilter)
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof PositionFilter];
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  round(number: number) {
    return MathHelper.round(number, 2);
  }

  private justifyFilter(position: Position, filter: PositionFilter) : boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof PositionFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(position, filter) : false;
      }
    }
    return true;
  }
}
