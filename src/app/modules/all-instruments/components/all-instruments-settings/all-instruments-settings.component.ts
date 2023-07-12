import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  AllInstrumentsSettings
} from '../../model/all-instruments-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.component.html',
  styleUrls: ['./all-instruments-settings.component.less']
})
export class AllInstrumentsSettingsComponent implements OnInit {
  @Input() guid!: string;
  @Output() settingsChange: EventEmitter<AllInstrumentsSettings> = new EventEmitter<AllInstrumentsSettings>();
  form!: UntypedFormGroup;
  allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settingsService.getSettings<AllInstrumentsSettings>(this.guid).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      if (settings) {
        this.form = new UntypedFormGroup({
          allInstrumentsColumns: new UntypedFormControl(settings.allInstrumentsColumns, Validators.required),
        });
      }
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings<AllInstrumentsSettings>(
      this.guid,
      {
        ...this.form.value,
      }
    );

    this.settingsChange.emit();
  }
}
