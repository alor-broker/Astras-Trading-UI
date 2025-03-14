import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {StringValueValidationOptions} from "../models";
import {InstrumentUtils} from "../../../utils/instrument.utils";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";

export class ConstSymbolNode extends NodeBase {
  readonly outputSlotName = 'instruments';
  readonly symbolPropertyName = 'symbol';
  readonly exchangePropertyName = 'exchange';

  constructor() {
    super(ConstSymbolNode.title);

    this.addProperty(
      this.symbolPropertyName,
      "",
      SlotType.String,
      {
        validation: {
          minLength: 1,
          maxLength: 50
        } as StringValueValidationOptions
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
        } as StringValueValidationOptions
      }
    );

    this.addOutput(
      this.outputSlotName,
      SlotType.InstrumentsStr,
      {
        nameLocked: true,
        removable: false
      }
    );
  }

  static get nodeId(): string {
    return 'const-symbol';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InstrumentSelection;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      map(() => {
        const symbol = this.properties[this.symbolPropertyName] as string;
        const exchange = this.properties[this.exchangePropertyName] as string;

        if ((symbol ?? '').length > 0 && (exchange ?? '').length) {
          this.setOutputByName(
            this.outputSlotName,
            InstrumentUtils.toString({
              symbol,
              exchange
            })
          );

          return true;
        }

        return false;
      })
    );
  }
}
