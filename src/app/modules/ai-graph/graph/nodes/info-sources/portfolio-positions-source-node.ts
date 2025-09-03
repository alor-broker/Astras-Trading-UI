import { Observable, of, switchMap } from "rxjs";
import { map, take } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { SlotType } from "../../slot-types";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import { Position } from "../../../../../shared/models/positions/position.model";
import { TranslatorFn } from "../../../../../shared/services/translator.service";
import { PortfolioUtils } from "../../../utils/portfolio.utils";

export class PortfolioPositionsSourceNode extends NodeBase {
  readonly inputSlotName = 'portfolio';
  readonly outputSlotName = 'positions';

  private translatorFn?: Observable<TranslatorFn>;

  constructor() {
    super(PortfolioPositionsSourceNode.title);
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
    return 'portfolio-positions';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    // Initialize translator function for data fields
    this.translatorFn = context.translatorService.getTranslator('ai-graph/data-fields');

    return super.executor(context).pipe(
      switchMap(() => {
        const portfolioKeyString = this.getValueOfInput(this.inputSlotName) as string | undefined;
        if (portfolioKeyString === undefined || portfolioKeyString === null || portfolioKeyString.length === 0) {
            return of(false);
          }

        // Parse the portfolio string using PortfolioUtils
        const targetPortfolio = PortfolioUtils.fromString(portfolioKeyString);
        if (!targetPortfolio.portfolio || !targetPortfolio.exchange) {
          return of(false);
        }

        return context.positionsService.getAllByPortfolio(targetPortfolio.portfolio, targetPortfolio.exchange).pipe(
          switchMap(positions => {
            if (positions == null) {
              return of(false);
            }

            return this.translatorFn!.pipe(
              take(1),
              map(t => {
                const symbolLabel = t(['fields', 'symbol', 'text']);
                const exchangeLabel = t(['fields', 'exchange', 'text']);
                const volumeLabel = t(['fields', 'volume', 'text']);
                const avgPriceLabel = t(['fields', 'avgPrice', 'text']);
                const profitLabel = t(['fields', 'profit', 'text']);
                const dailyProfitLabel = t(['fields', 'dailyProfit', 'text']);

                const positionsText = positions.map((position: Position) => {
                  return [
                    `${symbolLabel} ${position.targetInstrument.symbol}`,
                    `${exchangeLabel} ${position.targetInstrument.exchange}`,
                    `${volumeLabel} ${position.currentVolume}`,
                    `${avgPriceLabel} ${position.avgPrice}`,
                    `${profitLabel} ${position.unrealisedPl}`,
                    `${dailyProfitLabel} ${position.dailyUnrealisedPl}`,
                  ].join('<br>');
                }).join('<br><br>');

                this.setOutputByName(this.outputSlotName, positionsText);
                return true;
              })
            );
          })
        );
      })
    );
  }
}
