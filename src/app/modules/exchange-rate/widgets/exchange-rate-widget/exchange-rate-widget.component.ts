import { Component, input, OnInit, output, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {Observable} from 'rxjs';
import {ExchangeRateSettings} from '../../models/exchange-rate-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {ExchangeRateComponent} from '../../components/exchange-rate/exchange-rate.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-exchange-rate-widget',
  templateUrl: './exchange-rate-widget.component.html',
  styleUrls: ['./exchange-rate-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    ExchangeRateComponent,
    AsyncPipe
  ]
})
export class ExchangeRateWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  public readonly shouldShowSettingsChange = output<boolean>();
  settings$!: Observable<ExchangeRateSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ExchangeRateSettings>(
      this.widgetInstance(),
      'ExchangeRateSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ExchangeRateSettings>(this.guid);

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
