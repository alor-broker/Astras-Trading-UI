import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {NewsWidgetSettings} from '@terminal-widgets-lib/widgets/news/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {NewsSection} from '@terminal-widgets-lib/widgets/news/types/news.types';
import {
  Observable,
  of,
  switchMap
} from 'rxjs';
import {map} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {News} from '@terminal-widgets-lib/widgets/news/components/news/news';
import {NewsSettings} from '@terminal-widgets-lib/widgets/news/components/news-settings/news-settings';

@Component({
  selector: 'ats-news-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    News,
    NewsSettings
  ],
  templateUrl: './news-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsWidget extends WidgetBase<NewsWidgetSettings> {
  widgetName = signal('');

  titleSuffix$: Observable<string> = of('');

  private readonly dashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly translatorService = inject(TranslatorService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly destroyRef = inject(DestroyRef);

  override ngOnInit() {
    super.ngOnInit();

    this.translatorService.getLangChanges().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.widgetName.set(WidgetsHelper.getWidgetName(this.widgetInstance().widgetMeta.widgetName, x))
    })
  }

  sectionChange(section: NewsSection): void {
    switch (section) {
      case NewsSection.All:
        this.titleSuffix$ = of('');
        break;
      case NewsSection.Portfolio:
        this.titleSuffix$ = this.dashboardService.selectedPortfolio$
          .pipe(
            map(p => `${p.portfolio} (${p.exchange})`)
          );
        break;
      case NewsSection.Symbol:
        this.titleSuffix$ = this.settings$
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

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<NewsWidgetSettings>(
      this.widgetInstance(),
      'NewsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: ValueHelper.getValueOrDefault(settings.refreshIntervalSec, 60)
      }),
      this.dashboardService,
      this.widgetSettingsService
    );
  }
}
