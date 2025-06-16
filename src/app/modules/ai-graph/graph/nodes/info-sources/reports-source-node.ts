import {
  forkJoin,
  Observable,
  of,
  switchMap
} from "rxjs";
import {
  map,
  take
} from "rxjs/operators";
import { NodeBase } from "../node-base";
import {
  ExtendedEditors,
  Portfolio,
  SlotType
} from "../../slot-types";
import { NodeCategories } from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import {
  DateValueValidationOptions,
  SelectValueValidationOptions
} from "../models";
import { add } from "date-fns";
import {
  ClientReport,
  ClientReportsService,
  ReportMarket,
  ReportTimeRange
} from "../../../../../shared/services/client-reports.service";
import { TranslatorFn } from "../../../../../shared/services/translator.service";
import { PortfolioUtils } from "../../../utils/portfolio.utils";
import { StringHelper } from "../../../../../shared/utils/string-helper";
import { MarketType } from "../../../../../shared/models/portfolio-key.model";

export class ReportsSourceNode extends NodeBase {
  readonly portfolioInputName = 'portfolio';
  readonly maxRecordsCountPropertyName = 'maxRecordsCount';
  readonly fromDatePropertyName = 'fromDate';
  readonly timeRangePropertyName = 'timeRange';
  readonly outputSlotName = 'reports';

  private translatorFn?: Observable<TranslatorFn>;

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
    // Initialize translator function for data fields
    this.translatorFn = context.translatorService.getTranslator('ai-graph/data-fields');

    return super.executor(context).pipe(
      switchMap(() => {
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
          const fromDate = this.properties[this.fromDatePropertyName] as Date | undefined;
          const timeRange = this.properties[this.timeRangePropertyName] as ReportTimeRange;

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

              return this.translatorFn!.pipe(
                take(1),
                map(t => {
                  const merged = this.mergeToString(items, t);
                  this.setOutputByName(this.outputSlotName, merged);
                  return true;
                })
              );
            })
          );
        }
      )
    );
  }

  private mergeToString(items: ClientReport[], t: TranslatorFn): string {
    if (items.length === 0) {
      return '';
    }

    const reportDateLabel = t(['fields', 'reportDate', 'text']);
    const commentLabel = t(['fields', 'reportComment', 'text']);

    return items.map(i => {
      const parts: string[] = [];
      parts.push(`${reportDateLabel} ${i.reportDate}`);
      if (i.comment) {
        parts.push(`${commentLabel} ${i.comment}`);
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');
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
