export interface NodeSlotOptions {
  label: string;
  removable?: boolean;
  nameLocked?: boolean;
}

export interface OutputDataObject {
  toToolTip?(): string;
}

export enum OutputFormat {
  Markdown = 'markdown',
}
