import { AllOrderBookHotKeyTypes } from "src/app/shared/models/terminal-settings/terminal-settings.model";

export interface ScalperCommand {
  type: AllOrderBookHotKeyTypes | 'workingVolumes';

  key: string;

  [key: string]: any;
}

export interface ModifierKeys {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}
