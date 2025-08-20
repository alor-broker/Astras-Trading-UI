import {NodeBase} from "../node-base";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import {forkJoin, Observable, switchMap} from "rxjs";
import {Portfolio, SlotType} from "../../slot-types";
import {PortfolioValueValidationOptions} from "../models";
import {map} from "rxjs/operators";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {InstrumentUtils} from "../../../utils/instrument.utils";
import {PortfolioUtils} from "../../../utils/portfolio.utils";

export class PortfolioNode extends NodeBase {
  readonly portfolioPropertyName = 'portfolio';
  readonly instrumentsOutputName = 'instruments';
  readonly portfolioOutputName = 'portfolio';

  constructor() {
    super(PortfolioNode.title);
    this.setColorOption({
      color: NodeCategoryColors["instrument-selection"].headerColor,
      bgcolor: NodeCategoryColors["instrument-selection"].bodyColor,
      groupcolor: NodeCategoryColors["instrument-selection"].headerColor
    });

    this.addProperty(
      this.portfolioPropertyName,
      null,
      SlotType.Portfolio,
      {
        validation: {
          required: false
        } as PortfolioValueValidationOptions
      }
    );

    this.addOutput(
      this.instrumentsOutputName,
      SlotType.InstrumentsStr,
      {
        nameLocked: true,
        removable: false
      }
    );

    // Add a portfolio output that can be connected to summary and positions nodes
    this.addOutput(
      this.portfolioOutputName,
      SlotType.Portfolio,
      {
        nameLocked: true,
        removable: false
      }
    );
  }

  static get nodeId(): string {
    return 'portfolio';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InstrumentSelection;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      switchMap(() => context.dataContext),
      switchMap(dataContext => {
        const targetPortfolio =
          this.properties[this.portfolioPropertyName] as Portfolio | undefined
          ?? dataContext.currentPortfolio;

        this.setOutputByName(this.portfolioOutputName, PortfolioUtils.toString(targetPortfolio));

        return forkJoin([
          this.preparePortfolioInstruments(targetPortfolio, context)
        ]).pipe(
          map(x => x.every(r => r))
        );
      })
    );
  }

  private preparePortfolioInstruments(portfolio: Portfolio, context: GraphProcessingContextService): Observable<boolean> {
    return context.positionsService.getAllByPortfolio(portfolio.portfolio, portfolio.exchange).pipe(
      map(positions => {
        if (positions == null) {
          return false;
        }

        const instruments = positions
          .filter(p => p.currentVolume !== 0)
          .map(p => p.targetInstrument);

        const merged = InstrumentUtils.fromArrayToString(instruments);
        this.setOutputByName(this.instrumentsOutputName, merged);

        return true;
      })
    );
  };
}
