import {Component, input, OnInit} from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {AsyncPipe} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {combineLatest, Observable} from "rxjs";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {MobileHomeScreenSettings} from "../../models/mobile-home-screen-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {
  MobileHomeScreenContentComponent
} from "../../components/mobile-home-screen-content/mobile-home-screen-content.component";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {filter, map} from "rxjs/operators";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";

@Component({
  selector: 'ats-mobile-home-screen-widget',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    MobileHomeScreenContentComponent,
    WidgetSkeletonComponent
  ],
  templateUrl: './mobile-home-screen-widget.component.html',
  styleUrl: './mobile-home-screen-widget.component.less'
})
export class MobileHomeScreenWidgetComponent implements OnInit {
  shouldShowSettings = false;
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<MobileHomeScreenSettings>;

  title$!: Observable<string>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService,
  ) {
  }

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<MobileHomeScreenSettings>(
      this.widgetInstance(),
      'MobileHomeScreenSettings',
      settings => ({...settings}),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid);

    this.title$ = combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => isPortfoliosEqual(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => `#${p.agreement}`)
    );
  }
}
