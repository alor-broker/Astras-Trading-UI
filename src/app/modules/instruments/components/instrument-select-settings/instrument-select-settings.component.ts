import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  allInstrumentsColumns,
  ColumnIds,
  InstrumentSelectSettings
} from 'src/app/shared/models/settings/instrument-select-settings.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { WatchlistCollection } from '../../models/watchlist.model';

@Component({
  selector: 'ats-instrument-select-settings[guid]',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit, OnDestroy {
  settingsForm!: FormGroup;
  prevSettings?: InstrumentSelectSettings;
  allInstrumentColumns: ColumnIds[] = allInstrumentsColumns;
  collection$?: Observable<WatchlistCollection>;
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly watchInstrumentsService: WatchInstrumentsService, private readonly watchlistCollectionService: WatchlistCollectionService) {
  }

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.collectionChanged$.pipe(
      startWith(null),
      map(() => this.watchlistCollectionService.getWatchlistCollection()),
    );

    this.watchInstrumentsService.getSettings(this.guid).pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.prevSettings = settings;
      this.buildSettingsForm();
    });
  }

  saveSettings() {
    if (this.settingsForm?.valid) {
      this.watchInstrumentsService.setSettings({
        ...this.prevSettings,
        ...this.settingsForm.value
      });

      this.settingsChange.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private buildSettingsForm() {
    this.settingsForm = new FormGroup({
      activeListId: new FormControl(this.prevSettings?.activeListId, [Validators.required]),
      instrumentColumns: new FormControl(this.prevSettings?.instrumentColumns)
    });
  }
}
