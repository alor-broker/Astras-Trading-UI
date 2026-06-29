import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  InputSignal,
  OnInit,
  output,
  viewChild
} from '@angular/core';
import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  Observable,
  shareReplay,
  take
} from "rxjs";
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsEditorRef} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-editor-ref.types';

export interface WidgetSettingsForm {
  guid: InputSignal<string>;
  readonly showCopy: boolean;
  readonly canSave: boolean;
  readonly canCopy: boolean;

  updateSettings(): void;

  createWidgetCopy(): void;
}

@Component({
  template: ''
})
export abstract class WidgetSettingsBase<T extends WidgetSettings> implements WidgetSettingsForm, OnInit, WidgetSettingsEditorRef {
  readonly settingsChange = output();

  readonly guid = input.required<string>();

  protected abstract settings$: Observable<T>;

  protected readonly settingsService = inject(WidgetSettingsService);

  protected readonly manageDashboardsService = inject(DesktopManageDashboardsService, {optional: true});

  protected readonly destroyRef = inject(DestroyRef);

  protected readonly settingsEditor = viewChild(WidgetSettingsEditor);

  /** Whether the settings editor is currently open; widgets can use it to hide stale content. */
  readonly isEditing = computed(() => this.settingsEditor()?.isOpen() ?? false);

  /** Open on mobile: the editor content is shown inline in the widget content slot. */
  readonly isInlineOpen = computed(() => this.settingsEditor()?.isInlineOpen() ?? false);

  /** The editor content template, rendered inline in the widget content slot on mobile. */
  readonly editorContentTpl = computed(() => this.settingsEditor()?.contentTpl() ?? null);

  get showCopy(): boolean {
    return this.manageDashboardsService != null;
  };

  get canSave(): boolean {
    return true;
  }

  get canCopy(): boolean {
    return this.canSave && this.manageDashboardsService != null;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
    });
  }

  /**
   * Single entry point the widget calls (gear click) to open the editor; the
   * editor decides the container. On mobile the gear stays visible, so a second
   * click toggles the editor closed.
   */
  openSettings(trigger: HTMLElement): void {
    const editor = this.settingsEditor();

    if (editor != null && editor.isOpen()) {
      editor.close();
      return;
    }

    // Re-read the current saved settings into the form on every open, so any
    // unsaved edits from a previous (cancelled) session are discarded.
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
      this.settingsEditor()?.open(trigger);
    });
  }

  updateSettings(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      this.settingsService.updateSettings(initialSettings.guid, this.getUpdatedSettings(initialSettings));
      this.settingsChange.emit();
      this.settingsEditor()?.close();
    });
  }

  requestClose(): void {
    this.settingsEditor()?.close();
  }

  createWidgetCopy(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      this.manageDashboardsService?.copyWidget(this.getSettingsToCopy(initialSettings));
    });
  }

  protected abstract getUpdatedSettings(initialSettings: T): Partial<T>;

  protected getSettingsToCopy(initialSettings: T): T {
    return {
      ...initialSettings,
      ...this.getUpdatedSettings(initialSettings)
    };
  }

  protected initSettingsStream(): void {
    this.settings$ = this.settingsService.getSettings<T>(this.guid()).pipe(
      shareReplay(1)
    );
  }

  protected abstract setCurrentFormValues(settings: T): void;
}
