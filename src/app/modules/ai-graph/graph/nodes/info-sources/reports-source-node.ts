import {forkJoin, Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {Portfolio, SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {DateValueValidationOptions, SelectValueValidationOptions} from "../models";
import {add} from "date-fns";
import {
  ClientReport,
  ClientReportsService,
  ReportMarket,
  ReportTimeRange
} from "../../../../../shared/services/client-reports.service";
import {PortfolioUtils} from "../../../utils/portfolio.utils";

export class ReportsSourceNode extends NodeBase {
  readonly portfolioInputName = 'portfolio';
  readonly marketInputName = 'market';
  readonly maxRecordsCountPropertyName = 'maxRecordsCount';
  readonly fromDatePropertyName = 'fromDate';
  readonly timeRangePropertyName = 'timeRange';
  readonly outputSlotName = 'reports';

  constructor() {
    super(ReportsSourceNode.title);

    this.addProperty(
      this.maxRecordsCountPropertyName,
      10,
      SlotType.Number,
      {
        validation: {
          required: true,
          min: 1,
          max: 1000,
          step: 1,
          allowDecimal: false,
          allowNegative: false
        }
      }
    );

    this.addProperty(
      this.fromDatePropertyName,
      null,
      SlotType.Date,
      {
        validation: {
          min: add(new Date(), {years: -5}),
          allowFuture: false,
          required: false
        } as DateValueValidationOptions
      }
    );

    this.addProperty(
      this.timeRangePropertyName,
      ReportTimeRange.Daily,
      SlotType.String,
      {
        validation: {
          required: true,
          allowedValues: Object.values(ReportTimeRange)
        } as SelectValueValidationOptions
      }
    );

    this.addInput(
      this.portfolioInputName,
      SlotType.Portfolio,
      {
        nameLocked: true,
        removable: false
      }
    );

    this.addInput(
      this.marketInputName,
      SlotType.Market,
      {
        nameLocked: true,
        removable: false
      }
    );

    this.addOutput(
      this.outputSlotName,
      SlotType.String,
      {
        removable: false
      }
    );
  }

  static get nodeId(): string {
    return 'reports';
  }


  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  static get title(): string {
    return 'Client Reports';
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      switchMap(() => {
          const portfolioKeyString = this.getValueOfInput(this.portfolioInputName) as string | undefined;
          const portfolioInputDescriptor = this.findInputSlot(this.portfolioInputName, true);
          if (
            portfolioInputDescriptor?.link != null
            && (portfolioKeyString == null || portfolioKeyString.length === 0)
          ) {
            return of(null);
          }

          if (!portfolioKeyString) {
            return of(null);
          }

          const market = this.getValueOfInput(this.marketInputName) as ReportMarket | undefined;
          const marketInputDescriptor = this.findInputSlot(this.marketInputName, true);
          if (
            marketInputDescriptor?.link != null
            && !market
          ) {
            return of(null);
          }

          if(!market) {
            return of(null);
          }

          const targetPortfolio = PortfolioUtils.fromString(portfolioKeyString);
          if (!targetPortfolio?.portfolio) {
            return of(null);
          }

          const limit = this.properties[this.maxRecordsCountPropertyName] as number | undefined ?? 10;
          const fromDate = this.properties[this.fromDatePropertyName] as Date | undefined;
          const timeRange = this.properties[this.timeRangePropertyName] as ReportTimeRange;

          return this.loadReports(
            targetPortfolio,
            limit,
            market,
            timeRange,
            context.clientReportsService,
            fromDate
          ).pipe(
            map(items => ({items}))
          );
        }
      ),
      map(x => {
        if (x?.items == null) {
          return false;
        }

        const merged = this.mergeToString(x.items);

        this.setOutputByName(
          this.outputSlotName,
          merged
        );

        return true;
      })
    );
  }

  private mergeToString(items: ClientReport[]): string {
    if (items.length === 0) {
      return '';
    }

    return items.map(i => {
      const parts: string[] = [];
      parts.push(`Report Date: ${i.reportDate}`);
      if (i.comment) {
        parts.push(`Comment: ${i.comment}`);
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');
  }

  private loadReports(
    targetPortfolio: Portfolio,
    limit: number,
    market: ReportMarket,
    timeRange: ReportTimeRange,
    reportsService: ClientReportsService,
    fromDate?: Date,
  ): Observable<ClientReport[]> {
    return reportsService.getAvailableReports(
      targetPortfolio.portfolio,
      market,
      timeRange,
      fromDate
    ).pipe(
      switchMap(reportIds => {
        if (!reportIds || reportIds.length === 0) {
          return of([]);
        }

        const idsToLoad = reportIds.slice(0, limit);
        const reportRequests = idsToLoad.map(reportId =>
          reportsService.getReport(targetPortfolio.portfolio, reportId.market, reportId.id)
        );

        return forkJoin(reportRequests).pipe(
          map(reports => reports.filter((r): r is ClientReport => !!r))
        );
      })
    );
  }
}