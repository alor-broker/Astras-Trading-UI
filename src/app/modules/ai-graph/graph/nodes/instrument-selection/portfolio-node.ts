import {NodeBase} from "../node-base";
import {NodeCategories} from "../node-categories";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {PortfolioKey, SlotType} from "../../slot-types";
import {PortfolioValueValidationOptions} from "../models";
import {map} from "rxjs/operators";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {InstrumentUtils} from "../../../utils/instrument.utils";

export class PortfolioNode extends NodeBase {
  readonly portfolioPropertyName = 'portfolio';
  readonly instrumentsOutputName = 'instruments';

  constructor() {
    super(PortfolioNode.title);

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
      this.instrumentsOutputName,
      SlotType.InstrumentsStr,
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
      switchMap(() => {
        const targetPortfolio = this.properties[this.portfolioPropertyName] as PortfolioKey | undefined;
        if (targetPortfolio == null) {
          return of(false);
        }

        return forkJoin([
          this.preparePortfolioInstruments(targetPortfolio, context)
        ]).pipe(
          map(x => x.every(r => r))
        );
      })
    );
  }

  private preparePortfolioInstruments(portfolio: PortfolioKey, context: GraphProcessingContextService): Observable<boolean> {
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
