import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable} from "rxjs";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isInstrumentEqual} from "../../../../shared/utils/settings-helper";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {InstrumentSearchComponent} from '../../../../shared/components/instrument-search/instrument-search.component';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzCollapseComponent, NzCollapsePanelComponent} from 'ng-zorro-antd/collapse';
import {
  InstrumentBoardSelectComponent
} from '../../../../shared/components/instrument-board-select/instrument-board-select.component';

@Component({
  selector: 'ats-option-board-settings',
  templateUrl: './option-board-settings.component.html',
  styleUrls: ['./option-board-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    InstrumentSearchComponent,
    NzInputDirective,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    InstrumentBoardSelectComponent
  ]
})
export class OptionBoardSettingsComponent extends WidgetSettingsBaseComponent<OptionBoardSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
  });

  protected settings$!: Observable<OptionBoardSettings>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
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
