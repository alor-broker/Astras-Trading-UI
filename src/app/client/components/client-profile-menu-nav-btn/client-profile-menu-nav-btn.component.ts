import {
  ChangeDetectionStrategy,
  Component,
  Inject
} from '@angular/core';
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {SESSION_CONTEXT, SessionContext} from "../../../shared/services/auth/session-context";
import {AsyncPipe, NgIf, NgTemplateOutlet} from "@angular/common";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {TranslocoDirective} from "@jsverse/transloco";
import {ModalService} from "../../../shared/services/modal.service";

@Component({
    selector: 'ats-client-profile-menu-nav-btn',
    imports: [
        AsyncPipe,
        NzButtonComponent,
        NzDropDownDirective,
        NzDropdownMenuComponent,
        NzIconDirective,
        NzMenuDirective,
        NzMenuItemComponent,
        TranslocoDirective,
        NgTemplateOutlet,
        NgIf
    ],
    templateUrl: './client-profile-menu-nav-btn.component.html',
    styleUrl: './client-profile-menu-nav-btn.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientProfileMenuNavBtnComponent {
  readonly externalLinks = this.environmentService.externalLinks;
  readonly helpLink$ = this.helpService.getHelpLink('main');

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly helpService: HelpService,
    @Inject(SESSION_CONTEXT)
    private readonly sessionContext: SessionContext,
    private readonly modalService: ModalService
  ) {
  }

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  logout(): void {
    this.sessionContext.logout();
  }

  openTerminalSettings(): void {
    this.modalService.openTerminalSettingsModal();
  }
}
