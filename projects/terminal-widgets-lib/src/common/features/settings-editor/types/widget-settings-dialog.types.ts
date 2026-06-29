import {
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

export interface WidgetSettingsDialogConfig {
  trigger: HTMLElement;
  contentTpl: TemplateRef<unknown>;
  viewContainerRef: ViewContainerRef;
  /** Invoked once when the dialog is disposed (buttons, Escape or being superseded). */
  afterClosed?: () => void;
}

export interface WidgetSettingsDialogHandle {
  close(): void;
}
