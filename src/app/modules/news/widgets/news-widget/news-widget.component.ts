import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {NewsSettings} from '../../models/news-settings.model';
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {Observable, of, switchMap} from "rxjs";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {NewsSection} from "../../models/news.model";
import {map} from "rxjs/operators";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {WidgetsHelper} from "../../../../shared/utils/widgets";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {NewsComponent} from '../../components/news/news.component';
import {NewsSettingsComponent} from '../../components/news-settings/news-settings.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-news-widget',
  templateUrl: './news-widget.component.html',
  styleUrls: ['./news-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    NewsComponent,
    NewsSettingsComponent,
    AsyncPipe
  ]
})
export class NewsWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly translatorService = inject(TranslatorService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<NewsSettings>;
  showBadge$!: Observable<boolean>;
  widgetTitle$: Observable<string> = of('');
  titleText!: string;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<NewsSettings>(
      this.widgetInstance(),
      'NewsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: getValueOrDefault(settings.refreshIntervalSec, 60)
      }),
      this.dashboardService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.titleText = WidgetsHelper.getWidgetName(this.widgetInstance().widgetMeta.widgetName, this.translatorService.getActiveLang());
  }

  sectionChange(section: NewsSection): void {
    switch (section) {
      case NewsSection.All:
        this.widgetTitle$ = of('');
        break;
      case NewsSection.Portfolio:
        this.widgetTitle$ = this.dashboardService.selectedPortfolio$
          .pipe(
            map(p => `${p.portfolio} (${p.exchange})`)
          );
        break;
      case NewsSection.Symbol:
        this.widgetTitle$ = this.settings$
          .pipe(
            switchMap(s => this.instrumentsService.getInstrument({
              symbol: s.symbol,
              exchange: s.exchange,
              instrumentGroup: s.instrumentGroup
            })),
            map(i => `${i!.symbol} ${(i!.instrumentGroup != null && i!.instrumentGroup.length > 0) ? '(' + i!.instrumentGroup + ')' : ''} ${i!.shortName}`)
          );
        break;
    }
  }
}
