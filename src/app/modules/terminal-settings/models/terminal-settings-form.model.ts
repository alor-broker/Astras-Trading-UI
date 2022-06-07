import { AbstractControl, FormGroup } from '@angular/forms';
import { TerminalSettings } from '../../../shared/models/terminal-settings/terminal-settings.model';

export type TerminalSettingsFormControls = { [key in keyof TerminalSettings]: AbstractControl };
export type TerminalSettingsFormGroup = FormGroup & { value: TerminalSettings, controls: TerminalSettingsFormControls };
