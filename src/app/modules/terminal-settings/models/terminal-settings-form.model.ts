import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { TerminalSettings } from '../../../shared/models/terminal-settings/terminal-settings.model';

export type TerminalSettingsFormControls = { [key in keyof TerminalSettings]: AbstractControl };
export type TerminalSettingsFormGroup = UntypedFormGroup & { value: TerminalSettings, controls: TerminalSettingsFormControls };
