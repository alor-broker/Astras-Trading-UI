import {Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {InstrumentKey, SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {NumberValueValidationOptions} from "../models";
import {addDaysUnix} from "../../../../../shared/utils/datetime";
import {InstrumentUtils} from "../../../utils/instrument.utils";

export class HistorySourceNode extends NodeBase {
  readonly inputSlotName = 'instruments';
  readonly maxRecordsCountPropertyName = 'maxRecordsCount';
  readonly timeframePropertyName = 'timeframe';
  readonly outputSlotName = 'history';

  constructor() {
    super(HistorySourceNode.title);

    this.addProperty(
      this.maxRecordsCountPropertyName,
      100,
      SlotType.Number,
      {
        validation: {
          required: true,
          min: 1,
          max: 1000,
          step: 1,
          allowDecimal: false,
          allowNegative: false
        } as NumberValueValidationOptions
      }
    );

    this.addProperty(
      this.timeframePropertyName,
      'D',
      SlotType.String,
      {
        validation: {
          required: true,
          allowedValues: ['D', 'W', 'M']
        }
      }
    );

    this.addInput(
      this.inputSlotName,
      SlotType.InstrumentsStr,
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
    return 'history';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    return super.executor(context).pipe(
      switchMap(() => {
        const targetInstruments = this.getValueOfInput(this.inputSlotName) as string | undefined;
        const inputDescriptor = this.findInputSlot(this.inputSlotName, true);
        if (
          inputDescriptor?.link != null
          && (targetInstruments == null || targetInstruments.length === 0)
        ) {
          return of(false);
        }

        const limit = this.properties[this.maxRecordsCountPropertyName] as number ?? 100;
        const timeframe = this.properties[this.timeframePropertyName] as string ?? 'D';
        const instrument = this.toInstrument(targetInstruments ?? '');

        if (!instrument) {
          return of(false);
        }

        const daysToLookBack = limit * (timeframe === 'D' ? 1 : timeframe === 'W' ? 7 : 30);

        return context.historyService.getHistory({
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          tf: timeframe,
          from: addDaysUnix(new Date(), -daysToLookBack),
          to: Math.round(Date.now() / 1000),
          countBack: limit
        }).pipe(
          map(response => {
            if (response === null || !Array.isArray(response.history) || response.history.length === 0) {
              this.setOutputByName(this.outputSlotName, '');
              return false;
            }

            const formattedCandles = response.history.map(candle => 
              `Date: ${new Date(candle.time * 1000).toISOString().split('T')[0]}\n` +
              `Open: ${candle.open}\n` +
              `High: ${candle.high}\n` +
              `Low: ${candle.low}\n` +
              `Close: ${candle.close}\n` +
              `Volume: ${candle.volume}`
            ).join('\n\n');

            this.setOutputByName(
              this.outputSlotName,
              formattedCandles
            );

            return true;
          })
        );
      })
    );
  }

  private toInstrument(rawValue: string): InstrumentKey | null {
    if (rawValue.length === 0) {
      return null;
    }

    if (InstrumentUtils.isArray(rawValue)) {
      const instruments = InstrumentUtils.fromStringToArray(rawValue);
      return instruments?.[0] ?? null;
    }

    return InstrumentUtils.fromString(rawValue);
  }
}
