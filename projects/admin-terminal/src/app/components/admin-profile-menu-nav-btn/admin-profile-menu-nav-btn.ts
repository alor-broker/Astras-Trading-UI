import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {EXTERNAL_LINKS_CONFIG} from '@terminal-core-lib/features/external-links/external-links.types';
import {HelpService} from "@terminal-core-lib/features/help-docs/services/help.service";
import {SESSION_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {
  AsyncPipe,
  NgTemplateOutlet
} from '@angular/common';

@Component({
  selector: 'atsa-admin-profile-menu-nav-btn',
  imports: [
    TranslocoDirective,
    NzDropdownDirective,
    NzButtonComponent,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NgTemplateOutlet,
    AsyncPipe,
    NzMenuItemComponent
  ],
  templateUrl: './admin-profile-menu-nav-btn.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileMenuNavBtn {
  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  private readonly helpService = inject(HelpService);

  readonly helpLink$ = this.helpService.getSectionHelp('main');

  private readonly sessionContext = inject(SESSION_CONTEXT);

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  logout(): void {
    this.sessionContext.logout();
  }

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}
