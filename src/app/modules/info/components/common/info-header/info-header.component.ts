import {
  Component,
  Input,
  ViewChild
} from '@angular/core';
import { NzAvatarComponent } from "ng-zorro-antd/avatar";
import { EnvironmentService } from "../../../../../shared/services/environment.service";
import { InstrumentSummary } from "../../../models/instrument-summary.model";

@Component({
  selector: 'ats-info-header',
  templateUrl: './info-header.component.html',
  styleUrls: ['./info-header.component.less'],
  imports: [
    NzAvatarComponent
  ],
  standalone: true
})
export class InfoHeaderComponent {
  @ViewChild('avatar')
  avatarEl?: NzAvatarComponent;

  @Input({required: true})
  info!: InstrumentSummary;

  iconsUrl = this.environmentService.alorIconsStorageUrl;

  constructor(
    private readonly environmentService: EnvironmentService
  ) {
  }

  @Input()
  set isVisible(value: boolean) {
    // Text incorrectly scaled in Chrome on mobile devices because of this element can be placed on non active tab
    // This forces to rerender avatar on widget activated
    if (value && this.avatarEl) {
      if (this.avatarEl.hasText) {
        this.avatarEl.ngOnChanges();
      }
    }
  }
}
