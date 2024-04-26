import { Component, Input, ViewChild } from '@angular/core';
import { ExchangeInfo } from '../../../models/exchange-info.model';
import { NzAvatarComponent } from "ng-zorro-antd/avatar";
import { EnvironmentService } from "../../../../../shared/services/environment.service";

@Component({
  selector: 'ats-info-header',
  templateUrl: './info-header.component.html',
  styleUrls: ['./info-header.component.less']
})
export class InfoHeaderComponent {
  @ViewChild('avatar')
  avatarEl?: NzAvatarComponent;

  @Input({required: true})
  info!: ExchangeInfo;

  @Input()
  set isVisible(value: boolean) {
    // Text incorrectly scaled in Chrome on mobile devices because of this element can be placed on non active tab
    // This forces to rerender avatar on widget activated
    if(value && this.avatarEl) {
      if(this.avatarEl.hasText) {
        this.avatarEl.ngOnChanges();
      }
    }
  }

  iconsUrl = this.environmentService.alorIconsStorageUrl;

  constructor(
    private readonly environmentService: EnvironmentService
  ) {
  }
}
