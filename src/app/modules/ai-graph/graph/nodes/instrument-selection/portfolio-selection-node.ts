import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { SlotType } from "../../slot-types";
import { NodeCategories } from "../node-categories";
import { PortfolioValueValidationOptions } from "../models";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";

export class PortfolioSelectionNode extends NodeBase {
  readonly portfolioPropertyName = 'portfolio';
  readonly exchangePropertyName = 'exchange';
  readonly outputSlotName = 'portfolio';

  constructor() {
    super(PortfolioSelectionNode.title);

    this.addProperty(
      this.portfolioPropertyName,
      null,
      SlotType.Portfolio,
      {
        validation: {
          required: true
        } as PortfolioValueValidationOptions
      }
    );

    this.addProperty(
      this.exchangePropertyName,
      "",
      SlotType.String,
      {
        validation: {
          minLength: 1,
          maxLength: 20
        } as PortfolioValueValidationOptions
      }
    );

    this.addOutput(
      this.outputSlotName,
      SlotType.Portfolio,
      {
        nameLocked: true,
        removable: false
      }
    );
  }

  static get nodeId(): string {
    return 'portfolio-selection';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InstrumentSelection;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      map(() => {
        const portfolio = this.properties[this.portfolioPropertyName] as string;
        const exchange = this.properties[this.exchangePropertyName] as string;

        if ((portfolio ?? '').length > 0 && (exchange ?? '').length) {
          this.setOutputByName(
            this.outputSlotName,
            { portfolio, exchange }
          );

          return true;
        }

        return false;
      })
    );
  }
}
