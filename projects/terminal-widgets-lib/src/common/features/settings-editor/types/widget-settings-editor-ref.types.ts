import {Signal} from '@angular/core';

/**
 * Reference to the settings editor consumed by `ats-widget-skeleton`. Bundles
 * the minimal integration API: the editor tells the skeleton when its regular
 * content must be hidden. The editor view is rendered through a named slot.
 * Implemented by `WidgetSettingsEditor`; `WidgetSettingsBase` forwards it to
 * the widget skeleton.
 */
export interface WidgetSettingsEditorRef {
  /** Whether the skeleton must hide the widget's regular content. */
  readonly shouldHideWidgetContent: Signal<boolean>;
}
