import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { LoadingEvent } from "../../models/components.model";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { AccountService } from "../../../../shared/services/account.service";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  switchMap
} from 'rxjs';
import {
  distinct,
  filter,
  map
} from "rxjs/operators";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import {
  ChartData,
  ChartOptions
} from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import moment from "moment";
import { PortfolioDynamics } from "../../../../shared/models/user/portfolio-dynamics.model";
import { AsyncPipe } from "@angular/common";

type DynamicsChartData = ChartData<'line', number[], Date>;
type DynamicsChartOptions = ChartOptions<'line'>;

interface ChartConfig {
  chartData: DynamicsChartData;
  charOptions: DynamicsChartOptions;
}

enum TimeRange {
  W1 = "W1"
}

@Component({
  selector: 'ats-portfolio-dynamics',
  standalone: true,
  imports: [
    BaseChartDirective,
    AsyncPipe
  ],
  templateUrl: './portfolio-dynamics.component.html',
  styleUrl: './portfolio-dynamics.component.less'
})
export class PortfolioDynamicsComponent implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  @Output()
  loadingChanged = new EventEmitter<LoadingEvent>();

  chartConfig$!: Observable<ChartConfig | null>;
  readonly selectedTimeRange$ = new BehaviorSubject<TimeRange>(TimeRange.W1);

  constructor(
    private readonly accountService: AccountService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }

  ngOnInit(): void {
    this.chartConfig$ = combineLatest({
      currentAgreement: this.getCurrentAgreement(),
      selectedTimeRange: this.selectedTimeRange$
    }).pipe(
      switchMap(x => {
        const toDate = moment();
        const fromDate = toDate.clone().add(-1, "week");

        return this.accountService.getPortfolioDynamicsForAgreement(
          x.currentAgreement,
          fromDate.toDate(),
          toDate.toDate()
        );
      }),
      map(d => {
        if (d == null) {
          return null;
        }

        return {
          chartData: this.prepareDatasets(d),
          charOptions: this.prepareChartOptions(d)
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.selectedTimeRange$.complete();
  }

  private riseLoadingChanged(loading: boolean): void {
    setTimeout(() => {
      this.loadingChanged.emit({loading, source: 'portfolio-dynamics'});
    });
  }

  private getCurrentAgreement(): Observable<string> {
    return combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => isPortfoliosEqual(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinct()
    );
  }

  private prepareDatasets(dynamics: PortfolioDynamics): DynamicsChartData {
    return {
      datasets: [
        {
          data: dynamics.portfolioValues.map(v => v.value)
        }
      ],
      labels: dynamics.portfolioValues.map(v => v.date)
    };
  }

  private prepareChartOptions(dynamics: PortfolioDynamics): DynamicsChartOptions {
    return {
      locale: 'ru',
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          type: "time"
        }
      }
    };
  }
}
