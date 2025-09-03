import { Observable, of, switchMap } from "rxjs";
import { map, take } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { SlotType } from "../../slot-types";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import { TranslatorFn } from "../../../../../shared/services/translator.service";
import { PortfolioUtils } from "../../../utils/portfolio.utils";

export class PortfolioSummarySourceNode extends NodeBase {
  readonly inputSlotName = 'portfolio';
  readonly outputSlotName = 'summary';

  private translatorFn?: Observable<TranslatorFn>;

  constructor() {
    super(PortfolioSummarySourceNode.title);
    this.setColorOption({
      color: NodeCategoryColors["info-sources"].headerColor,
      bgcolor: NodeCategoryColors["info-sources"].bodyColor,
      groupcolor: NodeCategoryColors["info-sources"].headerColor
    });

    this.addInput(
      this.inputSlotName,
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
        removable: false,
        nameLocked: true
      }
    );
  }

  static get nodeId(): string {
    return 'portfolio-summary';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    this.translatorFn = context.translatorService.getTranslator('ai-graph/data-fields');

    return super.executor(context).pipe(
      switchMap(() => {
        const portfolioKeyString = this.getValueOfInput(this.inputSlotName) as string | undefined;

        if (portfolioKeyString === undefined || portfolioKeyString === null || portfolioKeyString.length === 0) {
          return of(false);
        }

        const targetPortfolio = PortfolioUtils.fromString(portfolioKeyString);
        if (!targetPortfolio.portfolio || !targetPortfolio.exchange) {
          return of(false);
        }

        return context.portfolioSummaryService.getCommonSummary(targetPortfolio).pipe(
          switchMap(summary => {
            return this.translatorFn!.pipe(
              take(1),
              map(t => {
                const buyingPowerLabel = t(['fields', 'buyingPower', 'text']);
                const profitLabel = t(['fields', 'profit', 'text']);
                const portfolioValueLabel = t(['fields', 'portfolioValue', 'text']);
                const initialMarginLabel = t(['fields', 'initialMargin', 'text']);
                const commissionLabel = t(['fields', 'commission', 'text']);

                const summaryText = [
                  `${buyingPowerLabel} ${summary.buyingPower}`,
                  `${profitLabel} ${summary.profit} (${summary.profitRate}%)`,
                  `${portfolioValueLabel} ${summary.portfolioEvaluation}`,
                  `${initialMarginLabel} ${summary.initialMargin}`,
                  `${commissionLabel} ${summary.commission}`
                ].join('<br>');

                this.setOutputByName(this.outputSlotName, summaryText);
                return true;
              })
            );
          })
        );
      })
    );
  }
}
