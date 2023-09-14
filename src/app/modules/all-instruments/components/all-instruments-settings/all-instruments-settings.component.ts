import {
  Component,
  DestroyRef,
  OnInit,
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
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-all-instruments-settings',
  templateUrl: './all-instruments-settings.component.html',
  styleUrls: ['./all-instruments-settings.component.less']
})
export class AllInstrumentsSettingsComponent extends WidgetSettingsBaseComponent<AllInstrumentsSettings> implements OnInit {
  form!: UntypedFormGroup;
  allInstrumentsColumns: BaseColumnId[] = allInstrumentsColumns;

  protected settings$!: Observable<AllInstrumentsSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      if (settings) {
        this.form = new UntypedFormGroup({
          allInstrumentsColumns: new UntypedFormControl(settings.allInstrumentsColumns, Validators.required),
        });
      }
    });
  }

  protected getUpdatedSettings(): Partial<AllInstrumentsSettings> {
    return {
      ...this.form.value,
    };
  }
}
