import {AllOrderBookHotKeyTypes} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

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
