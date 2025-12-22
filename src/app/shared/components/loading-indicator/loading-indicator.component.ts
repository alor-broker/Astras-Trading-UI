import {Component, input} from '@angular/core';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.less'],
  imports: [
    NzSpinComponent,
    NzIconDirective
  ]
})
export class LoadingIndicatorComponent {
  readonly isLoading = input<boolean | null>(false);

  readonly className = input<string | null>();
}
