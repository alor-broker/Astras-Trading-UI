import {
  forkJoin,
  Observable,
  of,
  switchMap
} from "rxjs";
import { map } from "rxjs/operators";
import { NodeBase } from "../node-base";
import {
  ExtendedEditors,
  Portfolio,
  SlotType
} from "../../slot-types";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import {
  DateValueValidationOptions,
  SelectValueValidationOptions
} from "../models";
import {
  add,
  startOfDay
} from "date-fns";
import {
  ClientReport,
  ClientReportsService,
  ReportMarket,
  ReportTimeRange
} from "../../../../../shared/services/client-reports.service";
import { PortfolioUtils } from "../../../utils/portfolio.utils";
import { StringHelper } from "../../../../../shared/utils/string-helper";
import { MarketType } from "../../../../../shared/models/portfolio-key.model";

export class ReportsSourceNode extends NodeBase {
  readonly portfolioInputName = 'portfolio';

  readonly maxRecordsCountPropertyName = 'maxRecordsCount';

  readonly fromDatePropertyName = 'fromDate';

  readonly timeRangePropertyName = 'timeRange';

  readonly outputSlotName = 'reports';

  constructor() {
    super(ReportsSourceNode.title);
    this.setColorOption({
      color: NodeCategoryColors["info-sources"].headerColor,
      bgcolor: NodeCategoryColors["info-sources"].bodyColor,
      groupcolor: NodeCategoryColors["info-sources"].headerColor
    });

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
        editorType: ExtendedEditors.Select,
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
    return 'reports';
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      switchMap(() => context.dataContext),
      switchMap(dataContext => {
          const portfolioKeyString = this.getValueOfInput(this.portfolioInputName) as string | undefined;
          if (portfolioKeyString === undefined || portfolioKeyString === null || portfolioKeyString.length === 0) {
            return of(false);
          }

          const targetPortfolio = PortfolioUtils.fromString(portfolioKeyString);

          if (targetPortfolio == null
            || StringHelper.isNullOrEmpty(targetPortfolio.agreement)
            || StringHelper.isNullOrEmpty(targetPortfolio.market)
          ) {
            return of(false);
          }

          const limit = this.properties[this.maxRecordsCountPropertyName] as number | undefined ?? 10;
          const timeRange = this.properties[this.timeRangePropertyName] as ReportTimeRange;

          let fromDate = this.properties[this.fromDatePropertyName] as Date | undefined;
          fromDate ??= startOfDay(
            add(
              dataContext.currentDate,
              {
                months: timeRange === ReportTimeRange.Daily ? -1 : -12
              }
            ));

          return this.loadReports(
            targetPortfolio,
            limit,
            timeRange,
            context.clientReportsService,
            fromDate
          ).pipe(
            switchMap(items => {
              if (items.length === 0) {
                return of(false);
              }

              const merged = this.mergeToString(items);
              this.setOutputByName(this.outputSlotName, merged);
              return of(true);
            })
          );
        }
      )
    );
  }

  private mergeToString(items: ClientReport[]): string {
    if (items.length === 0) {
      return '';
    }
    return items.map(i => {
      const clone = JSON.parse(JSON.stringify(i)) as Partial<ClientReport>;

      delete clone.clientName;
      delete clone.clientSignatureName;
      delete clone.clientSignatureResolution;
      delete clone.clientSignatureRemarks;

      return '~~~json\n' +
        JSON.stringify(clone, null, 2) +
        '\n' + '~~~';
    }).join('\n\n');
  }

  private loadReports(
    targetPortfolio: Portfolio,
    limit: number,
    timeRange: ReportTimeRange,
    reportsService: ClientReportsService,
    fromDate?: Date,
  ): Observable<ClientReport[]> {
    const reportMarket: ReportMarket = targetPortfolio.market === MarketType.ForeignExchange
      ? ReportMarket.Currency
      : ReportMarket.United;

    return reportsService.getAvailableReports(
      targetPortfolio.agreement,
      reportMarket,
      timeRange,
      limit,
      fromDate
    ).pipe(
      switchMap(reportIds => {
        if (!reportIds || reportIds.length === 0) {
          return of([]);
        }

        const reportRequests = reportIds.map(reportId =>
          reportsService.getReport(targetPortfolio.agreement, reportMarket, reportId.id)
        );

        return forkJoin(reportRequests).pipe(
          map(reports => reports.filter((r): r is ClientReport => !!r))
        );
      })
    );
  }
}
