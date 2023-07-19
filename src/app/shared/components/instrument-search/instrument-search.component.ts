import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { SearchFilter } from '../../../modules/instruments/models/search-filter.model';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import {
  BehaviorSubject,
  Observable,
  of
} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  switchMap
} from 'rxjs/operators';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { InstrumentKey } from '../../models/instruments/instrument-key.model';
import { Instrument } from '../../models/instruments/instrument.model';
import { DeviceService } from "../../services/device.service";

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
  @Input()
  optionsBoxWidth?: number;

  @Input()
  exchange?: string;
  filteredInstruments$: Observable<Instrument[]> = of([]);
  selectedValue?: InstrumentKey | null;
  @Output()
  instrumentSelected = new EventEmitter<InstrumentKey | null>();
  isMobile$!: Observable<boolean>;

  searchControl = new FormControl<string | null>(null);

  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);
  private touched = false;

  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly deviceService: DeviceService
  ) {
  }

  ngOnInit(): void {
    this.isMobile$ = this.deviceService.deviceInfo$
      .pipe(
        map(d => d.isMobile)
      );

    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.instrumentsService.getInstruments(filter))
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
      if(!this.exchange) {
        filter.exchange = parts[nextPartIndex].toUpperCase();
        nextPartIndex++;
      }

      filter.query = parts[nextPartIndex];
      nextPartIndex++;
      filter.instrumentGroup = parts[nextPartIndex]?.toUpperCase() ?? '';
    }
    else {
      filter.query = value;
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: InstrumentKey) {
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

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: InstrumentKey): void {
    this.searchControl.setValue(value?.symbol);
    this.selectedValue = value;
  }

  checkInstrumentSelection() {
    if (this.touched && !this.selectedValue) {
      this.emitValue(null);
    }
  }

  private emitValue(value: InstrumentKey | null) {
    this.selectedValue = value;
    this.onValueChanged(value);
    this.instrumentSelected.emit(value);
  }

  private onValueChanged: (value: InstrumentKey | null) => void = () => {
  };

  private onTouched = () => {
  };

  private markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }

    this.selectedValue = null;
  }
}
