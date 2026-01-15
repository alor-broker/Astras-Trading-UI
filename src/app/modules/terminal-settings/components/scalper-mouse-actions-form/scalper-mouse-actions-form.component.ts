import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import {
  MouseActionsSchemes,
  ScalperOrderBookMouseActionsMap,
  ScalperOrderBookMouseActionsMapItem
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {TerminalSettingsHelper} from '../../../../shared/utils/terminal-settings-helper';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {filter} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';

@Component({
  selector: 'ats-scalper-mouse-actions-form',
  templateUrl: './scalper-mouse-actions-form.component.html',
  styleUrls: ['./scalper-mouse-actions-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ScalperMouseActionsFormComponent
    }
  ],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzTableComponent,
    TableRowHeightDirective,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzTbodyComponent
  ]
})
export class ScalperMouseActionsFormComponent extends ControlValueAccessorBaseComponent<ScalperOrderBookMouseActionsMap> implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    mapName: this.formBuilder.control<MouseActionsSchemes | null>(null, Validators.required),
    actions: this.formBuilder.control<ScalperOrderBookMouseActionsMapItem[]>([], Validators.required)
  });

  availableDefaultSchemes = Object.values(MouseActionsSchemes);

  writeValue(value: ScalperOrderBookMouseActionsMap | null): void {
    if (!value) {
      return;
    }

    this.form.patchValue(value, {emitEvent: false});
  }

  ngOnInit(): void {
    this.form.controls.mapName.valueChanges.pipe(
      filter(x => x != null && x.length > 0),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(scheme => {
      this.form.controls.actions.setValue(this.getDefaultSchemeActions(scheme!).actions);
    });

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkIfTouched();

      if (!this.form!.valid) {
        this.emitValue(null);
        return;
      }

      this.emitValue(this.formValueToMap());
    });
  }

  protected needMarkTouched(): boolean {
    return this.form?.touched ?? false;
  }

  private formValueToMap(): ScalperOrderBookMouseActionsMap {
    const formValue = this.form.value;
    return {
      mapName: formValue.mapName!,
      actions: formValue.actions!
    };
  }

  private getDefaultSchemeActions(scheme: MouseActionsSchemes): ScalperOrderBookMouseActionsMap {
    if (scheme === MouseActionsSchemes.Scheme1) {
      return TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1();
    }

    return TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme2();
  }
}
