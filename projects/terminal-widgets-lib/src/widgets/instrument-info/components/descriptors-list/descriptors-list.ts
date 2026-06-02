import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {DescriptorsGroup} from '../../types/instrument-descriptors.types';

@Component({
  selector: 'ats-descriptors-list',
  imports: [
    TranslocoDirective,
    NzTooltipDirective
  ],
  templateUrl: './descriptors-list.html',
  styleUrl: './descriptors-list.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptorsList {
  readonly descriptors = input<DescriptorsGroup[]>([]);
}
