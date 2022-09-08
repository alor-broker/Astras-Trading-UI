import { Component, OnInit } from '@angular/core';
import { Observable, of, take } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { TerminalSettingsFormControls, TerminalSettingsFormGroup } from "../../models/terminal-settings-form.model";
import { TerminalSettingsService } from "../../services/terminal-settings.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { updateTerminalSettings } from "../../../../store/terminal-settings/terminal-settings.actions";
import { Store } from "@ngrx/store";

@Component({
  selector: 'ats-terminal-settings-widget',
  templateUrl: './terminal-settings-widget.component.html',
  styleUrls: ['./terminal-settings-widget.component.less']
})
export class TerminalSettingsWidgetComponent implements OnInit {

  readonly validationSettings = {
    userIdleDurationMin: {
      min: 1,
      max: 1140
    }
  };

  isVisible$: Observable<boolean> = of(false);
  settingsForm!: TerminalSettingsFormGroup;

  constructor(
    private modal: ModalService,
    private readonly service: TerminalSettingsService,
    private readonly store: Store
  ) { }

  ngOnInit(): void {
    this.isVisible$ = this.modal.shouldShowTerminalSettingsModal$;
    this.initForm();
  }

  handleClose() {
    this.modal.closeTerminalSettingsModal();
  }

  saveSettingsChanges() {
    if (this.settingsForm?.valid) {
      this.store.dispatch(updateTerminalSettings({
        updates: {
          ...this.settingsForm.value,
          userIdleDurationMin: Number(this.settingsForm.value.userIdleDurationMin)
        } as TerminalSettings
      }));
    }

    this.handleClose();
  }

  private initForm() {
    this.service.getSettings()
      .pipe(
        take(1)
      ).subscribe(settings => {
      this.settingsForm = this.buildForm(settings);
    });
  }

  private buildForm(currentSettings: TerminalSettings): TerminalSettingsFormGroup {
    return new FormGroup({
        timezoneDisplayOption: new FormControl(currentSettings.timezoneDisplayOption, Validators.required),
        userIdleDurationMin: new FormControl(
          currentSettings.userIdleDurationMin,
          [
            Validators.required,
            Validators.min(this.validationSettings.userIdleDurationMin.min),
            Validators.max(this.validationSettings.userIdleDurationMin.max)
          ]),
        badgesBind: new FormControl(currentSettings.badgesBind),
        hotKeysSettings: new FormGroup({
          cancelOrdersKey: new FormControl(currentSettings.hotKeysSettings?.cancelOrdersKey),
          closePositionsKey: new FormControl(currentSettings.hotKeysSettings?.closePositionsKey),
          centerOrderbookKey: new FormControl(currentSettings.hotKeysSettings?.centerOrderbookKey),
          cancelOrderbookOrders: new FormControl(currentSettings.hotKeysSettings?.cancelOrderbookOrders),
          closeOrderbookPositions: new FormControl(currentSettings.hotKeysSettings?.closeOrderbookPositions),
          reverseOrderbookPositions: new FormControl(currentSettings.hotKeysSettings?.reverseOrderbookPositions),
          buyMarket: new FormControl(currentSettings.hotKeysSettings?.buyMarket),
          sellMarket: new FormControl(currentSettings.hotKeysSettings?.sellMarket),
          workingVolumes: new FormArray(
            currentSettings.hotKeysSettings?.workingVolumes?.map(wv => new FormControl(wv, Validators.required))
            || []
          ),
          sellBestOrder: new FormControl(currentSettings.hotKeysSettings?.sellBestOrder),
          buyBestOrder: new FormControl(currentSettings.hotKeysSettings?.buyBestOrder),
        })
      } as TerminalSettingsFormControls
    ) as TerminalSettingsFormGroup;
  }
}
