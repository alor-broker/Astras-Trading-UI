import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,} from '@angular/core';
import {SearchFilter} from '../../../modules/instruments/models/search-filter.model';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective,
  NzOptionSelectionChange
} from 'ng-zorro-antd/auto-complete';
import {InstrumentsService} from '../../../modules/instruments/services/instruments.service';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map, switchMap} from 'rxjs/operators';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import {InstrumentKey} from '../../models/instruments/instrument-key.model';
import {Instrument} from '../../models/instruments/instrument.model';
import {DeviceService} from "../../services/device.service";
import { toInstrumentKey } from "../../utils/instruments";
import { Exchange } from "../../../../generated/graphql.types";
import { TranslocoDirective } from "@jsverse/transloco";
import {
  NzInputDirective,
  NzInputGroupComponent
} from "ng-zorro-antd/input";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";
import {
  AsyncPipe,
  NgForOf,
  NgIf
} from "@angular/common";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { NzTagComponent } from "ng-zorro-antd/tag";
import { NzIconDirective } from "ng-zorro-antd/icon";

@Component({
  selector: 'ats-instrument-search',
  templateUrl: './instrument-search.component.html',
  styleUrls: ['./instrument-search.component.less'],
  standalone: true,
  imports: [
    TranslocoDirective,
    NzInputGroupComponent,
    NzInputDirective,
    NzAutocompleteTriggerDirective,
    ReactiveFormsModule,
    NzTooltipDirective,
    NgIf,
    NzTypographyComponent,
    NzAutocompleteComponent,
    AsyncPipe,
    NzAutocompleteOptionComponent,
    NgForOf,
    NzTagComponent,
    NzIconDirective
  ],
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

    const filter: SearchFilter = {
      limit: 20,
      query: ''
    };

    filter.exchange = this.isExchangeSpecified
      ? this.exchange
      : '';

    if (value.includes(':')) {
      const parts = value.split(':');

      let nextPartIndex = 0;
      if (filter.exchange == null || filter.exchange.length === 0) {
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

  get isExchangeSpecified(): boolean {
    return this.exchange != null
      && this.exchange.length > 0
      && (this.exchange as Exchange) !== Exchange.United;
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
    const instrumentKey = value != null
      ? toInstrumentKey(value)
      : null;

    this.selectedValue = instrumentKey;
    this.onValueChanged(instrumentKey);
    this.instrumentSelected.emit(instrumentKey);
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
