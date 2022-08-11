import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Subject, takeUntil } from "rxjs";
import { AllInstrumentsSettings, allInstrumentsColumns, ColumnIds } from "../../../../shared/models/settings/all-instruments-settings.model";

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.component.html',
  styleUrls: ['./all-instruments-settings.component.less']
})
export class AllInstrumentsSettingsComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  @Input() guid!: string;
  @Output() settingsChange: EventEmitter<AllInstrumentsSettings> = new EventEmitter<AllInstrumentsSettings>();
  form!: FormGroup;
  allInstrumentsColumns: ColumnIds[] = allInstrumentsColumns;

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settingsService.getSettings<AllInstrumentsSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      if (settings) {
        this.form = new FormGroup({
          allInstrumentsColumns: new FormControl(settings.allInstrumentsColumns, Validators.required),
        });
      }
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings(
      this.guid,
      {
        ...this.form.value,
      }
    );

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
