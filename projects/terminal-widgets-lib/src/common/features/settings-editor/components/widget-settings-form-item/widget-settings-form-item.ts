import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  ViewEncapsulation
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
  NzFormModule,
  type NzFormControlComponent
} from 'ng-zorro-antd/form';

/** Standard vertical label/control pair for widget settings. */
@Component({
  selector: 'ats-widget-settings-form-item',
  imports: [NzFormModule],
  template: `
    <nz-form-item class="widget-settings-form-item">
      <nz-form-label [nzFor]="resolvedControlId()" [nzRequired]="required()">{{ label() }}</nz-form-label>
      <nz-form-control
        [nzErrorTip]="errorTip()"
        [nzValidateStatus]="projectedControl() ?? ''"
      >
        <ng-content/>
      </nz-form-control>
    </nz-form-item>
  `,
  styleUrl: './widget-settings-form-item.less',
  host: {
    '[style.display]': "'contents'"
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsFormItem {
  readonly label = input.required<string>();

  readonly controlId = input<string | null>(null);

  readonly required = input(false);

  readonly errorTip = input<NzFormControlComponent['nzErrorTip']>();

  protected readonly projectedControl = contentChild(NgControl, {descendants: true});

  protected readonly resolvedControlId = computed(() => {
    const explicitId = this.controlId();
    if (explicitId != null) {
      return explicitId;
    }

    const controlName = this.projectedControl()?.name;
    return controlName != null ? controlName.toString() : undefined;
  });
}
