import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-loading-indicator',
  imports: [
    NzSpinComponent,
    NzIconDirective
  ],
  templateUrl: './loading-indicator.html',
  styleUrl: './loading-indicator.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIndicator {
  readonly isLoading = input<boolean | null>(false);

  readonly className = input<string | null>();
}
