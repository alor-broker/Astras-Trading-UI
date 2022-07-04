import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  allInstrumentsColumns,
  ColumnIds,
  InstrumentSelectSettings
} from 'src/app/shared/models/settings/instrument-select-settings.model';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import {
  map,
  startWith
} from 'rxjs/operators';
import { WatchlistCollection } from '../../models/watchlist.model';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-instrument-select-settings[guid]',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit, OnDestroy {
  settingsForm!: FormGroup;
  allInstrumentColumns: ColumnIds[] = allInstrumentsColumns;
  collection$?: Observable<WatchlistCollection>;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly watchlistCollectionService: WatchlistCollectionService) {
  }

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.collectionChanged$.pipe(
      startWith(null),
      map(() => this.watchlistCollectionService.getWatchlistCollection()),
    );

    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.buildSettingsForm(settings);
    });
  }

  saveSettings() {
    if (this.settingsForm?.valid) {
      this.settingsService.updateSettings(
        this.guid,
        {
          ...this.settingsForm.value
        }
      );

      this.settingsChange.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private buildSettingsForm(currentSettings: InstrumentSelectSettings) {
    this.settingsForm = new FormGroup({
      activeListId: new FormControl(currentSettings.activeListId, [Validators.required]),
      instrumentColumns: new FormControl(currentSettings.instrumentColumns)
    });
  }
}
