import {
  Component,
  Input,
} from '@angular/core';
import { InstrumentSummary } from "../../../models/instrument-summary.model";
import { InstrumentIconComponent } from "../../../../../shared/components/instrument-icon/instrument-icon.component";

@Component({
    selector: 'ats-info-header',
    templateUrl: './info-header.component.html',
    styleUrls: ['./info-header.component.less'],
  imports: [
    InstrumentIconComponent
  ]
})
export class InfoHeaderComponent {
  @Input({required: true})
  info!: InstrumentSummary;
}
