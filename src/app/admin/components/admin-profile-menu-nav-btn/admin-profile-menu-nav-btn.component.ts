import {Component, Inject} from '@angular/core';
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {SESSION_CONTEXT, SessionContext} from "../../../shared/services/auth/session-context";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {AsyncPipe, NgIf, NgTemplateOutlet} from "@angular/common";

@Component({
  selector: 'ats-admin-profile-menu-nav-btn',
  standalone: true,
  templateUrl: './admin-profile-menu-nav-btn.component.html',
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzDropDownDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NgTemplateOutlet,
    NzMenuItemComponent,
    AsyncPipe,
    NgIf
  ],
  styleUrl: './admin-profile-menu-nav-btn.component.less'
})
export class AdminProfileMenuNavBtnComponent {
  readonly externalLinks = this.environmentService.externalLinks;
  readonly helpLink$ = this.helpService.getHelpLink('main');

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly helpService: HelpService,
    @Inject(SESSION_CONTEXT)
    private readonly sessionContext: SessionContext
  ) {
  }

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  logout(): void {
    this.sessionContext.logout();
  }
}
