import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {TreemapSettings} from "../../models/treemap.model";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {Observable} from "rxjs";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {TreemapComponent} from '../../components/treemap/treemap.component';
import {TreemapSettingsComponent} from '../../components/treemap-settings/treemap-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-treemap-widget',
  templateUrl: './treemap-widget.component.html',
  styleUrls: ['./treemap-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    TreemapComponent,
    TreemapSettingsComponent,
    AsyncPipe
  ]
})
export class TreemapWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<TreemapSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<TreemapSettings>(
      this.widgetInstance(),
      'TreemapSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        refreshIntervalSec: getValueOrDefault(settings.refreshIntervalSec, 60)
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TreemapSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
