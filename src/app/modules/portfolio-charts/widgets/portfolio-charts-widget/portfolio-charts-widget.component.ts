import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { AsyncPipe } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { TranslocoDirective } from "@jsverse/transloco";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import {
  combineLatest,
  distinctUntilChanged,
  Observable
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {
  filter,
  map
} from "rxjs/operators";
import { PortfolioChartsSettings } from "../../models/portfolio-charts-settings";
import { AgreementDynamicsComponent } from "../../components/agreement-dynamics/agreement-dynamics.component";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";

@Component({
  selector: 'ats-portfolio-charts-widget',
  imports: [
    AsyncPipe,
    SharedModule,
    TranslocoDirective,
    AgreementDynamicsComponent
],
  templateUrl: './portfolio-charts-widget.component.html',
  styleUrl: './portfolio-charts-widget.component.less'
})
export class PortfolioChartsWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  title$!: Observable<string>;

  settings$!: Observable<PortfolioChartsSettings>;

  currentAgreement$: Observable<string> | null = null;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioChartsSettings>(
      this.widgetInstance,
      'PortfolioChartsSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<PortfolioChartsSettings>(this.guid);

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );

    this.currentAgreement$ = this.getCurrentAgreement();
  }

  private getCurrentAgreement(): Observable<string> {
    const selectedPortfolio$ = this.settings$.pipe(
      map(s => ({
        portfolio: s.portfolio,
        exchange: s.exchange
      }))
    );

    return combineLatest({
      targetPortfolio: selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => p.portfolio === x.targetPortfolio.portfolio && p.exchange === x.targetPortfolio.exchange);
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinctUntilChanged((previous, current) => previous === current)
    );
  }
}
