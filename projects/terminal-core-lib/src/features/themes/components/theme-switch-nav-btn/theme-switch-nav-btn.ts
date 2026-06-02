import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {TerminalSettingsService} from '../../../terminal-settings/services/terminal-settings.service';
import {GlobalLoadingIndicatorService} from '../../../../common/services/global-loading-indicator.service';
import {
  Observable,
  take
} from 'rxjs';
import {TerminalSettings} from '../../../terminal-settings/terminal-settings.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ThemeType} from '../../themes.types';
import {GuidGenerator} from '../../../../common/utils/guid-generator';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {FormsModule} from '@angular/forms';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-theme-switch-nav-btn',
  imports: [
    NzSwitchComponent,
    FormsModule,
    NzIconDirective
  ],
  templateUrl: './theme-switch-nav-btn.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitchNavBtn implements OnInit {
  protected readonly isLoading = signal(false);

  protected readonly isDarkThemeApplied = signal(false);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly destroyRef = inject(DestroyRef);

  private terminalSettings$!: Observable<TerminalSettings>;

  ngOnInit(): void {
    this.terminalSettings$ = this.terminalSettingsService.getSettings();

    this.terminalSettings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => {
      this.isDarkThemeApplied.set(s.designSettings?.theme === ThemeType.dark);
    });
  }

  changeTheme(): void {
    this.isLoading.set(true);
    this.terminalSettings$.pipe(
      take(1)
    ).subscribe(s => {
      const newTheme = s.designSettings?.theme === ThemeType.dark
        ? ThemeType.default
        : ThemeType.dark;

      this.globalLoadingIndicatorService.registerLoading(GuidGenerator.newGuid());
      this.terminalSettingsService.updateSettings(
        {
          designSettings: {
            ...s.designSettings,
            theme: newTheme
          }
        },
        true,
        () => {
          setTimeout(() => {
              window.location.reload();
            },
            250
          );
        }
      );
    });
  }
}
