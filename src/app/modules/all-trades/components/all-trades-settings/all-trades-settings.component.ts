import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns,
  ColumnIds
} from '../../models/all-trades-settings.model';

@Component({
  selector: 'ats-all-trades-settings',
  templateUrl: './all-trades-settings.component.html',
  styleUrls: ['./all-trades-settings.component.less']
})
export class AllTradesSettingsComponent implements OnInit, OnDestroy {

  form!: UntypedFormGroup;
  allTradesColumns: ColumnIds[] = allTradesWidgetColumns;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  @Input() guid!: string;
  @Output() settingsChange: EventEmitter<AllTradesSettings> = new EventEmitter<AllTradesSettings>();

  constructor(private readonly settingsService: WidgetSettingsService) {}

  ngOnInit(): void {
    this.settingsService.getSettings<AllTradesSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      if (settings) {
        this.form = new UntypedFormGroup({
          allTradesColumns: new UntypedFormControl(settings.allTradesColumns, Validators.required),
          highlightRowsBySide: new UntypedFormControl(settings.highlightRowsBySide ?? false, Validators.required)
        });
      }
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings<AllTradesSettings>(
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
