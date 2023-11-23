import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Observable } from "rxjs";
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { OptionBoardSettings } from "../../models/option-board-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-option-board-settings',
  templateUrl: './option-board-settings.component.html',
  styleUrls: ['./option-board-settings.component.less']
})
export class OptionBoardSettingsComponent extends WidgetSettingsBaseComponent<OptionBoardSettings> implements OnInit {
  form?: UntypedFormGroup;
  protected settings$!: Observable<OptionBoardSettings>;

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
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup)
      });
    });
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form!.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form!.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  protected getUpdatedSettings(initialSettings: OptionBoardSettings): Partial<OptionBoardSettings> {
    const formValue = this.form!.value as Partial<OptionBoardSettings & { instrument: InstrumentKey }>;

    const newSettings = {
      ...formValue,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange,
    } as OptionBoardSettings;

    delete newSettings.instrument;
    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings as Partial<OptionBoardSettings>;
  }
}
