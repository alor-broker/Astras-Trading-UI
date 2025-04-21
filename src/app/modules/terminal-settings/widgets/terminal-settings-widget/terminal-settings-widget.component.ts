import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, of, take} from 'rxjs';
import {ModalService} from 'src/app/shared/services/modal.service';
import {TerminalSettings} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { TabNames } from '../../models/terminal-settings.model';
import { GlobalLoadingIndicatorService } from "../../../../shared/services/global-loading-indicator.service";
import { GuidGenerator } from "../../../../shared/utils/guid";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {TranslocoDirective} from "@jsverse/transloco";
import {TerminalSettingsModule} from "../../terminal-settings.module";
import {AsyncPipe, NgIf} from "@angular/common";
import {NzButtonComponent} from "ng-zorro-antd/button";

@Component({
    selector: 'ats-terminal-settings-widget',
    templateUrl: './terminal-settings-widget.component.html',
    styleUrls: ['./terminal-settings-widget.component.less'],
    imports: [
        NzModalComponent,
        TranslocoDirective,
        TerminalSettingsModule,
        AsyncPipe,
        NzModalFooterDirective,
        NgIf,
        NzModalContentDirective,
        NzButtonComponent
    ]
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
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly globalLoadingIndicatorService: GlobalLoadingIndicatorService,
    private readonly modalService: ModalService
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
    this.isVisible$ = this.modalService.shouldShowTerminalSettingsModal$;
  }

  closeModal(): void {
    this.modalService.closeTerminalSettingsModal();
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
      this.isLoading$.next(true);

      this.terminalSettingsService.getSettings().pipe(
        take(1)
      ).subscribe(currentSettings => {
        const newSettings = this.getTerminalSettingsUpdates(this.settingsFormValue!);
        const isReloadNeeded = this.isReloadNeeded(currentSettings, newSettings);

        if(isReloadNeeded) {
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
      || currentSettings.isLogoutOnUserIdle !== newSettings.isLogoutOnUserIdle
      || currentSettings.designSettings?.fontFamily !== newSettings.designSettings?.fontFamily
      || currentSettings.designSettings?.gridType !== newSettings.designSettings?.gridType
      || currentSettings.language !== newSettings.language;
  }
}
