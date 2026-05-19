import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {HelpService} from '@terminal-core-lib/features/help-docs/services/help.service';
import {SESSION_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {EXTERNAL_LINKS_CONFIG} from '@terminal-core-lib/features/external-links/external-links.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {
  AsyncPipe,
  NgTemplateOutlet
} from '@angular/common';
import {TerminalSettingsDialog} from '@terminal-core-lib/features/terminal-settings/components/terminal-settings-dialog/terminal-settings-dialog';

@Component({
  selector: 'atsd-profile-menu-nav-btn',
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NgTemplateOutlet,
    AsyncPipe,
    TerminalSettingsDialog
  ],
  templateUrl: './profile-menu-nav-btn.html',
  styleUrls: ['./profile-menu-nav-btn.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMenuNavBtn {
  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  protected readonly showTerminalSettings = signal(false);

  private readonly helpService = inject(HelpService);

  readonly helpLink$ = this.helpService.getSectionHelp('main');

  private readonly sessionContext = inject(SESSION_CONTEXT);

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  logout(): void {
    this.sessionContext.logout();
  }

  openTerminalSettings(): void {
    this.showTerminalSettings.set(true);
  }

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}
