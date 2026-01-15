import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NzSwitchModule} from "ng-zorro-antd/switch";
import {NzIconModule} from "ng-zorro-antd/icon";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {GlobalLoadingIndicatorService} from "../../../../shared/services/global-loading-indicator.service";
import {Observable, take} from "rxjs";
import {TerminalSettings} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ThemeType} from "../../../../shared/models/settings/theme-settings.model";
import {GuidGenerator} from "../../../../shared/utils/guid";

@Component({
    selector: 'ats-theme-switch-widget',
    imports: [
        FormsModule,
        NzIconModule,
        NzSwitchModule
    ],
    templateUrl: './theme-switch-widget.component.html',
    styleUrl: './theme-switch-widget.component.less'
})
export class ThemeSwitchWidgetComponent implements OnInit {
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = false;
  isDarkThemeApplied = true;

  private terminalSettings$!: Observable<TerminalSettings>;

  ngOnInit(): void {
    this.terminalSettings$ = this.terminalSettingsService.getSettings();

    this.terminalSettings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => {
      this.isDarkThemeApplied = s.designSettings?.theme === ThemeType.dark;
    });
  }

  changeTheme(): void {
    this.isLoading = true;
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
