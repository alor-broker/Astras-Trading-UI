import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-widget-settings-placeholder',
  imports: [
    TranslocoDirective,
    NzIconDirective
  ],
  templateUrl: './widget-settings-placeholder.html',
  styleUrl: './widget-settings-placeholder.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsPlaceholder {
}
