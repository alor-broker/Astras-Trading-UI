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

  private settingsFormValue: TerminalSettings | null = null;

  isVisible$: Observable<boolean> = of(false);

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

  formChange(value: TerminalSettings) {
    this.settingsFormValue = value;
  }

  saveSettingsChanges() {
    if (this.settingsFormValue) {
      this.store.dispatch(updateTerminalSettings({
        updates: {
          ...this.settingsFormValue,
          userIdleDurationMin: Number(this.settingsFormValue.userIdleDurationMin)
        } as TerminalSettings
      }));
    }

    this.handleClose();
  }
}
