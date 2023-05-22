import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, of, take} from 'rxjs';
import {ModalService} from 'src/app/shared/services/modal.service';
import {TerminalSettings} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {TabNames} from "../../models/terminal-settings.model";
import {TerminalSettingsService} from "../../services/terminal-settings.service";

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit, OnDestroy {

  settingsFormValue: TerminalSettings | null = null;
  isVisible$: Observable<boolean> = of(false);
  tabNames = TabNames;
  selectedTab = TabNames.usefulLinks;
  isLoading$ = new BehaviorSubject(false);
  private initialSettingsFormValue!: TerminalSettings;

  constructor(
    private modal: ModalService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get isSaveDisabled(): boolean {
    return !this.settingsFormValue ||
      (JSON.stringify(this.getTerminalSettingsUpdates(this.settingsFormValue)) === JSON.stringify(this.getTerminalSettingsUpdates(this.initialSettingsFormValue)));
  }

  ngOnInit(): void {
    this.isVisible$ = this.modal.shouldShowTerminalSettingsModal$;
  }

  handleClose() {
    this.modal.closeTerminalSettingsModal();
  }

  formChange(event: { value: TerminalSettings | null, isInitial: boolean }) {
    this.settingsFormValue = event.value;
    if (event.isInitial && !!event.value) {
      this.initialSettingsFormValue = event.value;
    }
  }

  saveSettingsChanges() {
    if (this.settingsFormValue) {
      this.isLoading$.next(true);

      this.terminalSettingsService.getSettings().pipe(
        take(1)
      ).subscribe(currentSettings => {
        const newSettings = this.getTerminalSettingsUpdates(this.settingsFormValue!);
        const isReloadNeeded = this.isReloadNeeded(currentSettings, newSettings);

        this.terminalSettingsService.updateSettings(
          newSettings,
          () => {
            if (isReloadNeeded) {
              window.location.reload();
              return;
            }

            this.isLoading$.next(false);
            this.handleClose();
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

  ngOnDestroy(): void {
    this.isLoading$.complete();
  }

  private isReloadNeeded(currentSettings: TerminalSettings, newSettings: TerminalSettings): boolean {
    return currentSettings.designSettings?.theme !== newSettings.designSettings?.theme
      || currentSettings.language !== newSettings.language;
  }
}
