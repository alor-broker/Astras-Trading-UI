import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsLayoutDesktop} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-layout-desktop/widget-settings-layout-desktop';
import {WidgetSettingsLayoutMobile} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-layout-mobile/widget-settings-layout-mobile';
import {WidgetSettingsDialogService} from '@terminal-widgets-lib/common/features/settings-editor/services/widget-settings-dialog.service';
import {WidgetSettingsDialogHandle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-dialog.types';
import {WidgetSettingsAuxToggle} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-aux-toggle.types';

/**
 * Device-agnostic widget settings editor. The widget just calls `open(trigger)`;
 * the editor itself decides where to render its content: inline inside the
 * current widget container (mobile) or as a dialog next to the trigger via
 * `WidgetSettingsDialogService` (desktop).
 *
 * Flexible content:
 * - settings may be declared in `<ats-widget-settings-group>` blocks (the editor
 *   shows group navigation), OR projected directly without any group (simple
 *   settings);
 * - an optional aux panel of standardized single-select toggles (`auxToggles`):
 *   the consumer reacts to the active toggle via `activeAuxToggle`.
 */
@Component({
  selector: 'ats-widget-settings-editor',
  imports: [
    WidgetSettingsLayoutDesktop,
    WidgetSettingsLayoutMobile
  ],
  templateUrl: './widget-settings-editor.html',
  styleUrl: './widget-settings-editor.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsEditor {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly canSave = input.required<boolean>();

  readonly canCopy = input.required<boolean>();

  readonly showCopy = input(false);

  /** Optional standardized aux toggles (icon + tooltip + id). Empty = no aux panel. */
  readonly auxToggles = input<readonly WidgetSettingsAuxToggle[]>([]);

  readonly saveClick = output();

  readonly cancelClick = output();

  readonly copyClick = output();

  /** The editor content template — stamped into the desktop overlay or the mobile content slot. */
  readonly contentTpl = viewChild.required<TemplateRef<unknown>>('contentTpl');

  /** Currently active aux toggle id (two-way); defaults to the first toggle. */
  protected readonly activeAuxToggle = model<string | null>(null);

  protected readonly groups = contentChildren(WidgetSettingsGroup, {descendants: true});

  protected readonly navGroups = computed(() => this.groups().filter(group => group.effectiveVisible()));

  protected readonly canLeaveCurrent = computed(() => this.activeGroup()?.isValid() ?? true);

  protected readonly isMobile = toSignal(
    inject(DeviceService).deviceInfo$.pipe(map(info => info.isMobile)),
    {initialValue: false}
  );

  private readonly selectedId = signal<string | null>(null);

  protected readonly activeGroup = computed(() => {
    const nav = this.navGroups();
    const selected = this.selectedId();

    return nav.find(group => group.groupId() === selected) ?? nav[0] ?? null;
  });

  private readonly translatorService = inject(TranslatorService);

  protected readonly widgetName = computed(() => {
    const meta = this.widgetInstance().widgetMeta;

    return meta != null
      ? WidgetsHelper.getWidgetName(meta.widgetName, this.translatorService.getActiveLang())
      : '';
  });

  private readonly opened = signal(false);

  /** Whether the editor is currently open (dialog on desktop, inline on mobile). */
  readonly isOpen = this.opened.asReadonly();

  /** Open on mobile: the content is rendered inline by the widget (in the content slot). */
  readonly isInlineOpen = computed(() => this.opened() && this.isMobile());

  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly dialogService = inject(WidgetSettingsDialogService);

  private dialogHandle: WidgetSettingsDialogHandle | null = null;

  constructor() {
    // Keep an active aux toggle: default to the first one, repair if it disappears.
    effect(() => {
      const toggles = this.auxToggles();
      const active = this.activeAuxToggle();

      if (toggles.length > 0 && (active == null || !toggles.some(toggle => toggle.id === active))) {
        this.activeAuxToggle.set(toggles[0].id);
      }
    });
  }

  open(trigger: HTMLElement): void {
    this.opened.set(true);

    if (!this.isMobile()) {
      this.dialogHandle = this.dialogService.open({
        trigger,
        contentTpl: this.contentTpl(),
        viewContainerRef: this.viewContainerRef,
        afterClosed: (): void => {
          this.opened.set(false);
          this.dialogHandle = null;
        }
      });
    }
  }

  close(): void {
    this.opened.set(false);
    this.dialogHandle?.close();
    this.dialogHandle = null;
  }

  selectGroup(groupId: string): void {
    if (!this.canLeaveCurrent()) {
      return;
    }

    this.selectedId.set(groupId);
  }

  selectAuxToggle(id: string): void {
    this.activeAuxToggle.set(id);
  }
}
