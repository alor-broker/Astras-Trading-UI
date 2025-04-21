import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Observable } from "rxjs";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { OptionBoardSettings } from "../../models/option-board-settings.model";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
    selector: 'ats-option-board-settings',
    templateUrl: './option-board-settings.component.html',
    styleUrls: ['./option-board-settings.component.less'],
    standalone: false
})
export class OptionBoardSettingsComponent extends WidgetSettingsBaseComponent<OptionBoardSettings> implements OnInit {
  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
  });

  protected settings$!: Observable<OptionBoardSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder,
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  protected getUpdatedSettings(initialSettings: OptionBoardSettings): Partial<OptionBoardSettings> {
    const formValue = this.form.value as Partial<InstrumentKey & { instrument: InstrumentKey }>;

    const newSettings: any = {
      ...formValue,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange,
    };

    delete newSettings.instrument;
    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings as Partial<OptionBoardSettings>;
  }

  protected setCurrentFormValues(settings: OptionBoardSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);
  }
}
