import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, of, take} from 'rxjs';
import {ModalService} from 'src/app/shared/services/modal.service';
import {TerminalSettings} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { TabNames } from '../../models/terminal-settings.model';

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit, OnDestroy {
  @Input()
  hiddenSections: string[] = [];

  settingsFormValue: TerminalSettings | null = null;
  isVisible$: Observable<boolean> = of(false);
  selectedTab = TabNames.usefulLinks;
  isLoading$ = new BehaviorSubject(false);
  private initialSettingsFormValue!: TerminalSettings;

  constructor(
    private modal: ModalService,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {
  }

  get isSettingsHasChanges(): boolean {
    return !!this.settingsFormValue &&
      (JSON.stringify(this.getTerminalSettingsUpdates(this.settingsFormValue)) !== JSON.stringify(this.getTerminalSettingsUpdates(this.initialSettingsFormValue)));
  }

  get isSaveAvailable(): boolean {
    return this.selectedTab !== TabNames.usefulLinks;
  }

  ngOnInit(): void {
    this.isVisible$ = this.modal.shouldShowTerminalSettingsModal$;
  }

  closeModal() {
    this.modal.closeTerminalSettingsModal();
  }

  handleClose() {
    if (this.isSaveAvailable && this.isSettingsHasChanges) {
      this.saveSettingsChanges();
      return;
    }

    this.closeModal();
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
          isReloadNeeded,
          () => {
            if (isReloadNeeded) {
              window.location.reload();
              return;
            }

            this.isLoading$.next(false);
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

  ngOnDestroy(): void {
    this.isLoading$.complete();
  }

  private isReloadNeeded(currentSettings: TerminalSettings, newSettings: TerminalSettings): boolean {
    return currentSettings.designSettings?.theme !== newSettings.designSettings?.theme
      || currentSettings.designSettings?.gridType !== newSettings.designSettings?.gridType
      || currentSettings.language !== newSettings.language;
  }
}
