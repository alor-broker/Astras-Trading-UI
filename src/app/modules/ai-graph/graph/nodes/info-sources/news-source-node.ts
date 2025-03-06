import {Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import { NodeBase } from "../node-base";
import {InstrumentKey, SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {NumberValueValidationOptions} from "../models";

export class NewsSourceNode extends NodeBase {
  readonly inputSlotName = 'instrument';
  readonly recordsCountPropertyName = 'recordsCount';
  readonly outputSlotName = 'news';

  constructor() {
    super(NewsSourceNode.title);

    this.addProperty(
      this.recordsCountPropertyName,
      50,
      SlotType.Number,
      {
        validation: {
          required: true,
          min: 1,
          max: 10000,
          step: 1,
          allowDecimal: false,
          allowNegative: false
        } as NumberValueValidationOptions
      }
    );

    this.addInput(
      this.inputSlotName,
      SlotType.InstrumentKey,
      {
        nameLocked: true,
        removable: false
      }
    );

    this.addOutput(
      this.outputSlotName,
      SlotType.String,
      {
        removable: false
      }
    );
  }

  static get nodeId(): string {
    return 'news';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return of(true).pipe(
      switchMap(() => {
        const targetInstrument = this.getValueOfInput(this.inputSlotName) as InstrumentKey | undefined;
        if (targetInstrument == null) {
          return of(false);
        }

        const limit = this.properties[this.recordsCountPropertyName] as number | undefined;

        return context.newsService.getNews({
          offset: 0,
          limit: limit ?? 50,
          symbols: [targetInstrument.symbol]
        }).pipe(
          map(x => {
            const merged = x.map(i => i.header)
              .join('<br><br>');

            this.setOutputByName(
              this.outputSlotName,
              merged
            );

            return true;
          })
        );
      })
    );
  }
}
