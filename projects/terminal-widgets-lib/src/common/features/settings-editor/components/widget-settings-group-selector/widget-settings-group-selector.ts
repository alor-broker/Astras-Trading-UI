import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';

/** Owns desktop group selection, guarded navigation and active group rendering. */
@Component({
  selector: 'ats-widget-settings-group-selector',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    NzIconDirective,
    NzTooltipDirective
  ],
  templateUrl: './widget-settings-group-selector.html',
  styleUrl: './widget-settings-group-selector.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsGroupSelector {
  readonly groups = input.required<readonly WidgetSettingsGroup[]>();

  private readonly selectedId = signal<string | null>(null);

  protected readonly activeGroup = computed(() => {
    const groups = this.groups();
    const selectedId = this.selectedId();

    return groups.find(group => group.groupId() === selectedId) ?? groups[0] ?? null;
  });

  protected readonly canLeaveCurrent = computed(() => this.activeGroup()?.isValid() ?? true);

  protected selectGroup(group: WidgetSettingsGroup): void {
    if (group === this.activeGroup() || !this.canLeaveCurrent()) {
      return;
    }

    this.selectedId.set(group.groupId());
  }
}
