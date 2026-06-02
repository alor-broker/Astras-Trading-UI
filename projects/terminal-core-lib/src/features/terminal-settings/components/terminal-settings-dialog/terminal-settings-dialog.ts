import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {TerminalSettingsService} from "../../services/terminal-settings.service";
import {GlobalLoadingIndicatorService} from '../../../../common/services/global-loading-indicator.service';
import {TerminalSettings} from "../../terminal-settings.types";
import {take} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from 'ng-zorro-antd/modal';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {GuidGenerator} from '../../../../common/utils/guid-generator';
import {TerminalSettingsEditor} from '@terminal-core-lib/features/terminal-settings/components/terminal-settings-editor/terminal-settings-editor';
import {TabNames} from '../terminal-settings-editing.types';

@Component({
  selector: 'ats-terminal-settings-dialog',
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    NzButtonComponent,
    NzModalFooterDirective,
    TerminalSettingsEditor
  ],
  templateUrl: './terminal-settings-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TerminalSettingsDialog {
  readonly atsVisible = model(false);

  readonly hiddenSections = input<string[]>([]);

  protected readonly selectedTab = signal(TabNames.usefulLinks);

  protected readonly isLoading = signal(false);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private settingsFormValue: TerminalSettings | null = null;

  private initialSettingsFormValue!: TerminalSettings;

  get isSettingsHasChanges(): boolean {
    return !!this.settingsFormValue &&
      (JSON.stringify(this.getTerminalSettingsUpdates(this.settingsFormValue)) !== JSON.stringify(this.getTerminalSettingsUpdates(this.initialSettingsFormValue)));
  }

  get isSaveAvailable(): boolean {
    return this.selectedTab() !== TabNames.usefulLinks;
  }

  closeModal(): void {
    this.atsVisible.set(false);
  }

  handleClose(): void {
    if (this.isSaveAvailable && this.isSettingsHasChanges) {
      this.saveSettingsChanges();
      return;
    }

    this.closeModal();
  }

  formChange(event: { value: TerminalSettings | null, isInitial: boolean }): void {
    this.settingsFormValue = event.value;
    if (event.isInitial && !!event.value) {
      this.initialSettingsFormValue = event.value;
    }
  }

  saveSettingsChanges(): void {
    if (this.settingsFormValue) {
      this.isLoading.set(true);

      this.terminalSettingsService.getSettings().pipe(
        take(1)
      ).subscribe(currentSettings => {
        const newSettings = this.getTerminalSettingsUpdates(this.settingsFormValue!);
        const isReloadNeeded = this.isReloadNeeded(currentSettings, newSettings);

        if (isReloadNeeded) {
          this.globalLoadingIndicatorService.registerLoading(GuidGenerator.newGuid());
        }

        this.terminalSettingsService.updateSettings(
          newSettings,
          isReloadNeeded,
          () => {
            if (isReloadNeeded) {
              window.location.reload();
              return;
            }

            this.isLoading.set(false);
            this.closeModal();
          }
        );
      });
    }
  }

  getTerminalSettingsUpdates(val: TerminalSettings): TerminalSettings {
    return {
      ...val,
      userIdleDurationMin: Number(val.userIdleDurationMin)
    } as TerminalSettings;
  }

  private isReloadNeeded(currentSettings: TerminalSettings, newSettings: TerminalSettings): boolean {
    return currentSettings.designSettings?.theme !== newSettings.designSettings?.theme
      || currentSettings.isLogoutOnUserIdle !== newSettings.isLogoutOnUserIdle
      || currentSettings.designSettings?.fontFamily !== newSettings.designSettings?.fontFamily
      || currentSettings.designSettings?.gridType !== newSettings.designSettings?.gridType
      || currentSettings.language !== newSettings.language;
  }
}
