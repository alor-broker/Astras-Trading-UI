import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { ScalperOrderBookMouseActionsMap } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import {
  NG_VALUE_ACCESSOR,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Destroyable } from '../../../../shared/utils/destroyable';
import { takeUntil } from 'rxjs';
import { TerminalSettingsHelper } from '../../../../shared/utils/terminal-settings-helper';

@Component({
  selector: 'ats-scalper-mouse-actions-form',
  templateUrl: './scalper-mouse-actions-form.component.html',
  styleUrls: ['./scalper-mouse-actions-form.component.less'],
  changeDetection:ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ScalperMouseActionsFormComponent
    }
  ]
})
export class ScalperMouseActionsFormComponent extends ControlValueAccessorBaseComponent<ScalperOrderBookMouseActionsMap> implements OnInit, OnDestroy {
  form!: UntypedFormGroup;
  availableDefaultSchemes = [
    'scheme1',
    'scheme2'
  ];

  private readonly destroyable = new Destroyable();

  constructor() {
    super();
  }

  writeValue(value: ScalperOrderBookMouseActionsMap | null): void {
    if (!this.form || !value) {
      return;
    }

    this.form.controls.mapName.setValue(value.mapName);
  }

  ngOnInit(): void {
    this.form = new UntypedFormGroup({
      mapName: new UntypedFormControl(null, Validators.required)
    });

    this.form.valueChanges.pipe(
      takeUntil(this.destroyable)
    ).subscribe(() => {
      this.checkIfTouched();

      if (!this.form.valid) {
        this.emitValue(null);
        return;
      }

      this.emitValue(this.getActionsFormScheme(this.form.value.mapName));
    });
  }

  getActionsFormScheme(scheme: 'scheme1' | 'scheme2'): ScalperOrderBookMouseActionsMap {
    if (scheme === 'scheme1') {
      return TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme1();
    }

    return TerminalSettingsHelper.getScalperOrderBookMouseActionsScheme2();
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  protected needMarkTouched(): boolean {
    return this.form.touched ?? false;
  }
}
