import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WidgetSettingsEditorRef} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-editor-ref.types';

@Component({
  selector: 'ats-widget-skeleton',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzIconDirective
  ],
  templateUrl: './widget-skeleton.html',
  styleUrl: './widget-skeleton.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSkeleton {
  readonly header = input.required<TemplateRef<unknown>>();

  readonly content = input.required<TemplateRef<unknown>>();

  // Legacy inline-settings inputs for widgets not yet migrated to the editor.
  readonly settings = input<TemplateRef<unknown> | null>();

  readonly showSettings = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);

  /** Editor-based widgets: a single ref providing the content template and editing state. */
  readonly settingsEditor = input<WidgetSettingsEditorRef | null>(null);

  /**
   * Opt-in: when the editor is open, replace stale content with an "editing
   * settings" placeholder (for widgets that do not reflect settings live).
   */
  readonly showEditingPlaceholder = input(false);

  /** Template to render in the content slot instead of the content (editor inline or legacy settings). */
  protected readonly inlineSettings = computed<TemplateRef<unknown> | null>(() => {
    const editor = this.settingsEditor();

    if (editor != null) {
      return editor.isInlineOpen() ? editor.editorContentTpl() : null;
    }

    return this.showSettings() ? (this.settings() ?? null) : null;
  });

  protected readonly showPlaceholder = computed(() =>
    this.showEditingPlaceholder() && (this.settingsEditor()?.isEditing() ?? false)
  );
}
