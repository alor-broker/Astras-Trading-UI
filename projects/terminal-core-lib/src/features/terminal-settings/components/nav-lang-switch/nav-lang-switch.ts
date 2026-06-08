import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {TerminalSettingsService} from '../../services/terminal-settings.service';
import {GlobalLoadingIndicatorService} from '../../../../common/services/global-loading-indicator.service';
import {TerminalLanguage} from '../../terminal-settings.types';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {GuidGenerator} from '../../../../common/utils/guid-generator';
import {AsyncPipe} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {LANGUAGES_CONFIG} from '../../../translations/translations.provides';

@Component({
  selector: 'ats-nav-lang-switch',
  imports: [
    AsyncPipe,
    NzButtonComponent,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent
  ],
  templateUrl: './nav-lang-switch.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavLangSwitch implements OnInit {
  protected currentLanguage$!: Observable<TerminalLanguage | null>;

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly languagesConfig = inject(LANGUAGES_CONFIG);

  readonly availableLanguages = Object.keys(this.languagesConfig).map(k => {
    const language = (this.languagesConfig as Record<string, { title: string }>)[k];
    return {
      key: k as TerminalLanguage,
      title: language.title,
    };
  });

  ngOnInit(): void {
    this.currentLanguage$ = this.terminalSettingsService.getSettings().pipe(
      map((settings) => settings.language ?? null),
      shareReplay(1)
    );
  }

  changeLanguage(language: TerminalLanguage): void {
    combineLatest({
      currentLanguage: this.currentLanguage$,
      currentSettings: this.terminalSettingsService.getSettings()
    }).pipe(
      take(1)
    ).subscribe(x => {
      if (language === x.currentLanguage) {
        return;
      }

      this.globalLoadingIndicatorService.registerLoading(GuidGenerator.newGuid());

      this.terminalSettingsService.updateSettings(
        {
          language: language
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
