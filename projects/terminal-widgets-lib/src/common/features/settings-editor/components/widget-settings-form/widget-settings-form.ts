import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {NzFormDirective} from 'ng-zorro-antd/form';

/** Provides the standard vertical layout for a widget settings form group. */
@Component({
  selector: 'ats-widget-settings-form',
  template: '<ng-content/>',
  host: {
    '[style.display]': "'block'"
  },
  hostDirectives: [NzFormDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsForm {
  private readonly formDirective = inject(NzFormDirective);

  constructor() {
    this.formDirective.nzLayout = 'vertical';
  }
}
