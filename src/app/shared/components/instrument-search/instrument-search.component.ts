import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,} from '@angular/core';
import {SearchFilter} from '../../../modules/instruments/models/search-filter.model';
import {NzOptionSelectionChange} from 'ng-zorro-antd/auto-complete';
import {InstrumentsService} from '../../../modules/instruments/services/instruments.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map, switchMap} from 'rxjs/operators';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {InstrumentKey} from '../../models/instruments/instrument-key.model';
import {Instrument} from '../../models/instruments/instrument.model';
import {DeviceService} from "../../services/device.service";

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
  @ViewChild('searchInput')
  searchInput?: ElementRef<HTMLInputElement>;

  @Input()
  optionsBoxWidth?: number;
  @Input()
  exchange?: string;
  @Input()
  showHelpTooltip = true;


  filteredInstruments$: Observable<Instrument[]> = of([]);
  selectedValue?: InstrumentKey | null;
  @Output()
  instrumentSelected = new EventEmitter<InstrumentKey | null>();
  isMobile$!: Observable<boolean>;
  searchControl = new FormControl<string | null>(null);
  private readonly filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);
  private touched = false;

  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly deviceService: DeviceService
  ) {
  }


  ngOnInit(): void {
    this.isMobile$ = this.deviceService.deviceInfo$
      .pipe(
        map(d => d.isMobile as boolean)
      );

    this.filteredInstruments$ = this.filter$.pipe(
      debounceTime(200),
      switchMap(filter => {
          if (!filter) {
            return of([]);
          }
          return this.instrumentsService.getInstruments(filter);
        }
      )
    );
  }

  filterChanged(value: string): void {
    this.markAsTouched();

    const filter = {
      limit: 20
    } as SearchFilter;

    filter.exchange = this.exchange ?? '';

    if (value.includes(':')) {
      const parts = value.split(':');

      let nextPartIndex = 0;
      if (this.exchange == null || !this.exchange.length) {
        filter.exchange = parts[nextPartIndex].toUpperCase();
        nextPartIndex++;
      }

      filter.query = parts[nextPartIndex];
      nextPartIndex++;
      filter.instrumentGroup = parts[nextPartIndex]?.toUpperCase() ?? '';
    } else {
      filter.query = value;
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: InstrumentKey): void {
    if (event.isUserInput) {
      this.emitValue(val);
    }
  }

  ngOnDestroy(): void {
    this.filter$.complete();
  }

  registerOnChange(fn: (value: InstrumentKey | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: (...args: any[]) => any): void {
    this.onTouched = fn;
  }

  writeValue(value: InstrumentKey | null): void {
    this.searchControl.setValue(value?.symbol ?? null);
    this.selectedValue = value;

    if (!value) {
      this.filter$.next(null);
      this.touched = false;
    }
  }

  checkInstrumentSelection(): void {
    if (this.touched && !this.selectedValue) {
      this.emitValue(null);
    }
  }

  setFocus(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  private emitValue(value: InstrumentKey | null): void {
    this.selectedValue = value;
    this.onValueChanged(value);
    this.instrumentSelected.emit(value);
  }

  private onValueChanged: (value: InstrumentKey | null) => void = () => {
  };

  private onTouched = (): void => {
  };

  private markAsTouched(): void {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }

    this.selectedValue = null;
  }
}
