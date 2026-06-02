import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {
  MouseActionsSchemes,
  ScalperOrderBookMouseActionsMap,
  ScalperOrderBookMouseActionsMapItem
} from '../../terminal-settings.types';
import {filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TerminalSettingsHelper} from '../../utils/terminal-settings.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormDirective,
  NzFormModule
} from 'ng-zorro-antd/form';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzTableComponent} from 'ng-zorro-antd/table';
import {TableRowHeight} from '../../../../common/directives/table-row-height';

@Component({
  selector: 'ats-scalper-mouse-actions-form',
  imports: [
    TranslocoDirective,
    NzFormDirective,
    ReactiveFormsModule,
    NzSelectComponent,
    NzOptionComponent,
    NzTableComponent,
    TableRowHeight,
    NzFormModule
  ],
  templateUrl: './scalper-mouse-actions-form.html',
  styleUrl: './scalper-mouse-actions-form.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => ScalperMouseActionsForm),
    }
  ],
})
export class ScalperMouseActionsForm extends ControlValueAccessorBase<ScalperOrderBookMouseActionsMap> implements OnInit {
  availableDefaultSchemes = Object.values(MouseActionsSchemes);

  private readonly formBuilder = inject(FormBuilder);

  form = this.formBuilder.group({
    mapName: this.formBuilder.control<MouseActionsSchemes | null>(null, Validators.required),
    actions: this.formBuilder.control<ScalperOrderBookMouseActionsMapItem[]>([], Validators.required)
  });

  private readonly destroyRef = inject(DestroyRef);

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
