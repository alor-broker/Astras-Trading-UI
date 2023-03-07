import {
  Component,
  OnInit
} from '@angular/core';
import {
  Observable,
  of
} from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { TabNames } from "../../models/terminal-settings.model";
import { TerminalSettingsService } from "../../services/terminal-settings.service";

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit {

  settingsFormValue: TerminalSettings | null = null;
  isVisible$: Observable<boolean> = of(false);
  tabNames = TabNames;
  selectedTab = TabNames.usefulLinks;
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
      this.terminalSettingsService.updateSettings(this.getTerminalSettingsUpdates(this.settingsFormValue));
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
