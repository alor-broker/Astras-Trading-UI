import { Observable, of, switchMap } from "rxjs";
import { map } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { SlotType } from "../../slot-types";
import { NodeCategories } from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import { Position } from "../../../../../shared/models/positions/position.model";

export class PortfolioPositionsSourceNode extends NodeBase {
  readonly inputSlotName = 'portfolio';
  readonly outputSlotName = 'positions';

  constructor() {
    super(PortfolioPositionsSourceNode.title);

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
    return 'portfolio-positions';
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

        return context.positionsService.getAllByPortfolio(portfolio, exchange).pipe(
          map(positions => {
            if (positions == null) {
              return false;
            }

            const positionsText = positions.map((position: Position) => {
              return [
                `Symbol: ${position.targetInstrument.symbol}`,
                `Exchange: ${position.targetInstrument.exchange}`,
                `Volume: ${position.currentVolume}`,
                `Average Price: ${position.avgPrice}`,
                `Profit: ${position.unrealisedPl}`,
                '---'
              ].join('\n');
            }).join('\n');

            this.setOutputByName(this.outputSlotName, positionsText);
            return true;
          })
        );
      })
    );
  }
}
