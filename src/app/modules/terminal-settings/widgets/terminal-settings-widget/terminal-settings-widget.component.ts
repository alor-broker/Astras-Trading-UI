import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { Store } from "@ngrx/store";
import { updateTerminalSettings } from "../../../../store/terminal-settings/terminal-settings.actions";

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit {

  private initialSettingsFormValue!: TerminalSettings;
  settingsFormValue: TerminalSettings | null = null;

  isVisible$: Observable<boolean> = of(false);

  selectedTab = 0;

  get isSaveDisabled(): boolean {
    return !this.settingsFormValue ||
      (JSON.stringify(this.getTerminalSettingsUpdates(this.settingsFormValue)) === JSON.stringify(this.getTerminalSettingsUpdates(this.initialSettingsFormValue)));
  }

  constructor(
    private modal: ModalService,
    private readonly store: Store
  ) { }

  ngOnInit(): void {
    this.isVisible$ = this.modal.shouldShowTerminalSettingsModal$;
  }

  handleClose() {
    this.modal.closeTerminalSettingsModal();
  }

  formChange(event: { value: TerminalSettings, isInitial: boolean }) {
    this.settingsFormValue = event.value;
    if (event.isInitial) {
      this.initialSettingsFormValue = event.value;
    }
  }

  saveSettingsChanges() {
    if (this.settingsFormValue) {
      this.store.dispatch(updateTerminalSettings({
        updates: this.getTerminalSettingsUpdates(this.settingsFormValue)
      }));
    }

    this.handleClose();
  }

  getTerminalSettingsUpdates(val: TerminalSettings): TerminalSettings {
    return {
      ...val,
      userIdleDurationMin: Number(val.userIdleDurationMin)
    } as TerminalSettings;
  }
}
