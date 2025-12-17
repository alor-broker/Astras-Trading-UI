import {
  Component,
  OnInit
} from '@angular/core';
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { GlobalLoadingIndicatorService } from "../../../../shared/services/global-loading-indicator.service";
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  take
} from "rxjs";
import { TerminalLanguage } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { environment } from "../../../../../environments/environment";
import { AsyncPipe } from "@angular/common";
import { NzButtonComponent } from "ng-zorro-antd/button";
import {
  NzDropDownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import { GuidGenerator } from "../../../../shared/utils/guid";

@Component({
  selector: 'ats-lang-switch-widget',
  imports: [
    AsyncPipe,
    NzButtonComponent,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent
  ],
  templateUrl: './lang-switch-widget.component.html',
  styleUrl: './lang-switch-widget.component.less',
})
export class LangSwitchWidgetComponent implements OnInit {
  readonly availableLanguages = Object.keys(environment.internationalization).map(k => {
    const language = (environment.internationalization as unknown as any)[k] as { title: string };
    return {
      key: k as TerminalLanguage,
      title: language.title,
    };
  });

  protected currentLanguage$!: Observable<TerminalLanguage | null>;

  constructor(
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly globalLoadingIndicatorService: GlobalLoadingIndicatorService
  ) {
  }

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
