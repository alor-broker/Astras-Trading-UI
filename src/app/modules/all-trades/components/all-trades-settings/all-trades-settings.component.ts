import {Component, DestroyRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-all-trades-settings',
  templateUrl: './all-trades-settings.component.html',
  styleUrls: ['./all-trades-settings.component.less']
})
export class AllTradesSettingsComponent implements OnInit {

  form!: UntypedFormGroup;
  allTradesColumns: BaseColumnId[] = allTradesWidgetColumns;

  @Input() guid!: string;
  @Output() settingsChange: EventEmitter<AllTradesSettings> = new EventEmitter<AllTradesSettings>();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.settingsService.getSettings<AllTradesSettings>(this.guid).pipe(
      takeUntilDestroyed(this.destroyRef)
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
}
