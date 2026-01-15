import {Component, input,} from '@angular/core';
import {InstrumentSummary} from "../../../models/instrument-summary.model";
import {InstrumentIconComponent} from "../../../../../shared/components/instrument-icon/instrument-icon.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";

@Component({
  selector: 'ats-info-header',
  templateUrl: './info-header.component.html',
  styleUrls: ['./info-header.component.less'],
  imports: [
    InstrumentIconComponent,
    NzTypographyComponent
  ]
})
export class InfoHeaderComponent {
  readonly info = input.required<InstrumentSummary>();
}
