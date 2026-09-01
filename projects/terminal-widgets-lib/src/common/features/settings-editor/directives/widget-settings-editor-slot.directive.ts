import {Directive} from '@angular/core';

/** Marks a settings component for projection into the widget editor content slot. */
@Directive({
  selector: '[atsWidgetSettingsEditor]',
  host: {
    '[style.display]': "'contents'"
  }
})
export class WidgetSettingsEditorSlot {
}
