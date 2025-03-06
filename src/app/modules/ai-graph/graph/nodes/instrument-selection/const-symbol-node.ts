import {Observable, of} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {OutputDataObject, StringValueValidationOptions} from "../models";

export class ConstSymbolNode extends NodeBase {
  readonly outputSlotName = 'instrument';
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
      SlotType.InstrumentKey,
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

  override executor(): Observable<boolean> {
    return of(true).pipe(
      map(() => {
        const symbol = this.properties[this.symbolPropertyName] as string;
        const exchange = this.properties[this.exchangePropertyName] as string;

        if ((symbol ?? '').length > 0 && (exchange ?? '').length) {
          this.setOutputByName(
            this.outputSlotName,
            {
              symbol,
              exchange,
            } as OutputDataObject
          );

          return true;
        }

        return false;
      })
    );
  }
}
