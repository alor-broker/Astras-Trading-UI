import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { InstrumentSelect } from '../../models/instrument-select.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';

@Component({
  selector: 'ats-instrument-select[shouldShowSettings][widget][settings]',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.sass']
})
export class InstrumentSelectComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<InstrumentSelectSettings>;
  @Input('settings') set settings(settings: InstrumentSelectSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<InstrumentSelectSettings>({});
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  filteredInstruments$: Observable<InstrumentSelect[]> = of([])
  selectedInstrument$: Observable<InstrumentKey | null> =  of(null)

  inputValue?: string;
  filteredOptions: string[] = [];
  constructor(private service: InstrumentsService, private sync: SyncService) {

  }

  onChange(value: string): void {
    console.log('change')
    const existing = this.filter$.getValue();
    if (existing) {
      this.filter$.next({
        ...existing,
        query: value
      });
    }
    this.filter$.next({
      query: value,
      limit: 10
    });
  }

  onSelect(event: NzOptionSelectionChange, val: InstrumentSelect) {
    if (event.isUserInput) {
      this.sync.selectNewInstrument(val);
    }
  }

  ngOnInit(): void {
    this.filteredInstruments$ = this.filter$.pipe(
      filter((f) : f is SearchFilter => !!f),
      switchMap(filter => this.service.getInstruments(filter))
    )
    this.selectedInstrument$ = this.sync.selectedInstrument$;
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
  }
}
