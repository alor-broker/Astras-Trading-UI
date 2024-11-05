import { Component } from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {AstrasLogoComponent} from "../../../../shared/components/astras-logo/astras-logo.component";
import {TranslocoDirective} from "@jsverse/transloco";

@Component({
  selector: 'ats-desktop-navbar',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslocoDirective,
    NzIconDirective,
    AstrasLogoComponent,
  ],
  templateUrl: './desktop-navbar.component.html',
  styleUrl: './desktop-navbar.component.less'
})
export class DesktopNavbarComponent {
}
