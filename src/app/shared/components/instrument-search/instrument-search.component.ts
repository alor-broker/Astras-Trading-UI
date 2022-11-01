import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { SearchFilter } from '../../../modules/instruments/models/search-filter.model';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import { Instrument } from '../../models/instruments/instrument.model';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import {
  BehaviorSubject,
  Observable,
  of,
  take
} from 'rxjs';
import {
  debounceTime,
  filter,
  switchMap
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { PortfolioKey } from '../../models/portfolio-key.model';
import { getSelectedPortfolioKey } from '../../../store/portfolios/portfolios.selectors';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { InstrumentKey } from '../../models/instruments/instrument-key.model';

@Component({
  selector: 'ats-instrument-search',
  templateUrl: './instrument-search.component.html',
  styleUrls: ['./instrument-search.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InstrumentSearchComponent
    }
  ]
})
export class InstrumentSearchComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('searchInput') searchInput?: ElementRef;
  filteredInstruments$: Observable<Instrument[]> = of([]);
  currentValue?: InstrumentKey | null;
  selectedValue?: InstrumentKey | null;
  @Output()
  instrumentSelected = new EventEmitter<Instrument | null>();
  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);
  private touched = false;

  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly store: Store,
  ) {
  }

  ngOnInit(): void {
    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.instrumentsService.getInstruments(filter))
    );
  }

  filterChanged(value: string): void {
   this.markAsTouched();
    this.getCurrentPortfolio().pipe(
      take(1)
    ).subscribe(portfolio => {
      const defaultExchange = portfolio.exchange ?? 'MOEX';

      const filter = {
        limit: 20
      } as SearchFilter;

      if (value.includes(':')) {
        const parts = value.split(':');

        filter.exchange = parts[0].toUpperCase();
        filter.query = parts[1];
        filter.instrumentGroup = parts[2]?.toUpperCase() ?? '';
      }
      else {
        filter.exchange = defaultExchange;
        filter.query = value;
        filter.instrumentGroup = '';
      }

      this.filter$.next(filter);
    });
  }

  onSelect(event: NzOptionSelectionChange, val: Instrument) {
    if (event.isUserInput) {
      this.emitValue(val);
    }
  }

  ngOnDestroy(): void {
    this.filter$.complete();
  }

  registerOnChange(fn: (symbol: string) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: InstrumentKey): void {
    this.currentValue = value;
    this.selectedValue = this.currentValue;
  }

  checkInstrumentSelection() {
    if (this.touched && !this.selectedValue) {
      this.emitValue(null);
    }
  }

  private emitValue(value: Instrument | null) {
    this.selectedValue = value;
    this.onValueChanged(value);
    this.instrumentSelected.emit(value);
  }

  private onValueChanged: (value: any) => void = () => {
  };

  private onTouched = () => {
  };

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.store.select(getSelectedPortfolioKey)
      .pipe(
        filter((p): p is PortfolioKey => !!p)
      );
  }

  private markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
      this.selectedValue = null;
    }
  }
}
