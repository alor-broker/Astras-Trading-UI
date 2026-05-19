import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {InstrumentSummary} from '../../types/instrument-summary.types';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';

@Component({
  selector: 'ats-info-header',
  imports: [
    NzTypographyComponent,
    InstrumentIcon
  ],
  templateUrl: './info-header.html',
  styleUrl: './info-header.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoHeaderInfoHeaderComponent {
  readonly info = input.required<InstrumentSummary>();
}
