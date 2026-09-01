import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {FreeFormValueHelper} from '../../utils/free-form-value.helper';

@Component({
  selector: 'ats-free-form-details',
  imports: [
    NgTemplateOutlet,
    NzIconDirective
  ],
  templateUrl: './free-form-details.html',
  styleUrl: './free-form-details.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreeFormDetails {
  readonly data = input.required<Record<string, unknown>>();

  protected readonly nodes = computed(() => FreeFormValueHelper.toDisplayTree(this.data(), 3));
}
