import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {WidgetSettingsEditorRef} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-editor-ref.types';
import {
  WidgetSkeletonContentSlot,
  WidgetSkeletonHeaderSlot
} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton-slots.directive';

@Component({
  selector: 'ats-widget-skeleton',
  imports: [NgTemplateOutlet],
  templateUrl: './widget-skeleton.html',
  styleUrl: './widget-skeleton.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSkeleton {
  /** @deprecated Use the `atsWidgetHeader` named slot. */
  readonly header = input<TemplateRef<unknown> | null>(null);

  /** @deprecated Use the `atsWidgetContent` named slot. */
  readonly content = input<TemplateRef<unknown> | null>(null);

  /** @deprecated Legacy inline settings fallback for widgets not yet migrated to the editor. */
  readonly settings = input<TemplateRef<unknown> | null>();

  /** @deprecated Legacy inline settings visibility. */
  readonly showSettings = input(false);

  readonly isBlockWidget = input.required<boolean>();

  readonly showContentScroll = input(false);

  /** Editor-based widgets: a ref that controls regular-content visibility. */
  readonly settingsEditor = input<WidgetSettingsEditorRef | null>(null);

  protected readonly projectedHeader = contentChild(WidgetSkeletonHeaderSlot);

  protected readonly projectedContent = contentChild(WidgetSkeletonContentSlot);

  protected readonly shouldHideWidgetContent = computed(() =>
    this.settingsEditor()?.shouldHideWidgetContent() ?? false
  );

  /** Legacy settings template rendered instead of the regular widget content. */
  protected readonly inlineSettings = computed<TemplateRef<unknown> | null>(() =>
    this.showSettings() ? (this.settings() ?? null) : null
  );
}
