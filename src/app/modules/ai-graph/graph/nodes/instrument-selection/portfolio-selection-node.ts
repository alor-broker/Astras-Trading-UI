import {NodeBase} from "../node-base";
import {NodeCategories} from "../node-categories";
import {PortfolioKey, SlotType} from "../../slot-types";
import {PortfolioValueValidationOptions} from "../models";

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

  override executor(): boolean {
    const selectedPortfolio = this.properties[this.portfolioPropertyName] as PortfolioKey | undefined;
    if (!selectedPortfolio) {
      return false;
    }

    this.setOutputByName(this.outputSlotName, selectedPortfolio);
    return true;
  }
}