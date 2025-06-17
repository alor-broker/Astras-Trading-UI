import {
  forkJoin,
  Observable,
  of,
  switchMap
} from "rxjs";
import { map } from "rxjs/operators";
import { NodeBase } from "../node-base";
import {
  ExtendedEditors,
  InstrumentKey,
  SlotType
} from "../../slot-types";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import {
  NumberValueValidationOptions,
  SelectValueValidationOptions
} from "../models";
import { addDaysUnix } from "../../../../../shared/utils/datetime";
import { InstrumentUtils } from "../../../utils/instrument.utils";
import { HistoryResponse } from "../../../../../shared/models/history/history-response.model";

export class HistorySourceNode extends NodeBase {
  readonly inputSlotName = 'instruments';

  readonly maxRecordsCountPropertyName = 'maxRecordsCount';

  readonly timeframePropertyName = 'timeframe';

  readonly outputSlotName = 'history';

  constructor() {
    super(HistorySourceNode.title);

    this.setColorOption({
      color: NodeCategoryColors["info-sources"].headerColor,
      bgcolor: NodeCategoryColors["info-sources"].bodyColor,
      groupcolor: NodeCategoryColors["info-sources"].headerColor
    });

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
        editorType: ExtendedEditors.Select,
        validation: {
          required: true,
          allowedValues: ['D', 'W', 'M']
        } as SelectValueValidationOptions
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
        const instruments = this.toInstruments(targetInstruments ?? '');

        if (instruments.length === 0) {
          return of(false);
        }

        return forkJoin(instruments.map(i => this.loadHistoryForInstrument(
          context,
          i,
          timeframe,
          limit
        ))).pipe(
          map(responses => {
            if (responses.some(r => r == null)) {
              this.setOutputByName(this.outputSlotName, '');
              return false;
            }

            const formatted = responses.map(r => {
              // We don't need translation for candles because there is no
              // straightforward terminology for them in russian.
              // I'm afraid LLM will be misled by the translation.
              return r!.history.history.map(candle =>
                `Ticker: ${r!.instrument.symbol}:${r!.instrument.exchange}\n` +
                `Date: ${new Date(candle.time * 1000).toISOString().split('T')[0]}\n` +
                `Open: ${candle.open}\n` +
                `High: ${candle.high}\n` +
                `Low: ${candle.low}\n` +
                `Close: ${candle.close}\n` +
                `Volume: ${candle.volume}`
              ).join('\n\n');
            }).join('\n\n---\n\n');

            this.setOutputByName(
              this.outputSlotName,
              formatted
            );

            return true;
          })
        );
      })
    );
  }

  private toInstruments(rawValue: string): InstrumentKey[] {
    if (rawValue.length === 0) {
      return [];
    }

    if (InstrumentUtils.isArray(rawValue)) {
      return InstrumentUtils.fromStringToArray(rawValue) ?? [];
    }

    return [InstrumentUtils.fromString(rawValue)];
  }

  private loadHistoryForInstrument(
    context: GraphProcessingContextService,
    instrument: InstrumentKey,
    timeframe: string,
    limit: number
  ): Observable<{ instrument: InstrumentKey, history: HistoryResponse } | null> {
    const daysToLookBack = limit * (timeframe === 'D' ? 1 : timeframe === 'W' ? 7 : 30);

    return context.historyService.getHistory({
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      tf: timeframe,
      from: addDaysUnix(new Date(), -daysToLookBack),
      to: Math.round(Date.now() / 1000),
      countBack: limit
    }).pipe(
      map(r => {
        if (r == null) {
          return null;
        }

        return {
          instrument,
          history: r
        };
      })
    );
  }
}
