import { NodeBase } from "../node-base";
import { NodeCategories } from "../node-categories";
import { PortfolioKey, SlotType } from "../../slot-types";
import { PortfolioValueValidationOptions } from "../models";
import { of, Observable } from "rxjs";

export class PortfolioSelectionNode extends NodeBase {
  readonly portfolioPropertyName = 'portfolio';
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

  override executor(): Observable<boolean> {
    const selectedPortfolio = this.properties[this.portfolioPropertyName] as PortfolioKey | undefined;
    if (!selectedPortfolio) {
      return of(false);
    }

    this.setOutputByName(this.outputSlotName, { portfolio: selectedPortfolio });
    return of(true);
  }
}
