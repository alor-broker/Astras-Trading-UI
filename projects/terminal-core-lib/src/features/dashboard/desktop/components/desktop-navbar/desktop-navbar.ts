import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {AppLogo} from '../../../../../common/components/app-logo/app-logo';

@Component({
  selector: 'ats-desktop-navbar',
  imports: [
    AppLogo
  ],
  templateUrl: './desktop-navbar.html',
  styleUrl: './desktop-navbar.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DesktopNavbar {

}
