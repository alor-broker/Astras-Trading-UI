import { Observable, of, switchMap } from "rxjs";
import { map } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { PortfolioKey, SlotType } from "../../slot-types";
import { NodeCategories } from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";

export class PortfolioSummarySourceNode extends NodeBase {
  readonly inputSlotName = 'portfolio';
  readonly outputSlotName = 'summary';

  constructor() {
    super(PortfolioSummarySourceNode.title);

    this.addInput(
      this.inputSlotName,
      SlotType.String,
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
    return super.executor(context).pipe(
      switchMap(() => {
        const portfolioKeyString = this.getValueOfInput(this.inputSlotName) as string | undefined;

        if (portfolioKeyString === undefined || portfolioKeyString === null || portfolioKeyString.length === 0) {
          return of(false);
        }

        // Parse the portfolio string format "portfolio:exchange"
        const parts = portfolioKeyString.split(':');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          return of(false);
        }

        const [portfolio, exchange] = parts;
        const targetPortfolio: PortfolioKey = { portfolio, exchange };

        return context.portfolioSummaryService.getCommonSummary(targetPortfolio).pipe(
          map(summary => {
            const summaryText = [
              `Buying Power: ${summary.buyingPower}`,
              `Profit: ${summary.profit} (${summary.profitRate}%)`,
              `Portfolio Value: ${summary.portfolioEvaluation}`,
              `Initial Margin: ${summary.initialMargin}`,
              `Commission: ${summary.commission}`
            ].join('\n');

            this.setOutputByName(this.outputSlotName, summaryText);
            return true;
          })
        );
      })
    );
  }
}
