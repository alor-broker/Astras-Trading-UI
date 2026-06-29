import {
  Signal,
  TemplateRef
} from '@angular/core';

/**
 * Reference to the settings editor consumed by `ats-widget-skeleton`. Bundles
 * everything the skeleton needs to render the editor inline (mobile) and the
 * editing placeholder, so the widget passes a single ref instead of several
 * derived inputs. Implemented by `WidgetSettingsBase`.
 */
export interface WidgetSettingsEditorRef {
  /** Editor content template, rendered in the widget content slot when open inline (mobile). */
  readonly editorContentTpl: Signal<TemplateRef<unknown> | null>;

  /** Whether the editor is open inline (mobile) — show the editor instead of the content. */
  readonly isInlineOpen: Signal<boolean>;

  /** Whether the editor is open at all — used (with the opt-in) to show the editing placeholder. */
  readonly isEditing: Signal<boolean>;
}
