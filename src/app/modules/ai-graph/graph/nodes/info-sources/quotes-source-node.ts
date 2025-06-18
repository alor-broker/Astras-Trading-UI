import { forkJoin, Observable, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { NodeBase } from "../node-base";
import { InstrumentKey, SlotType } from "../../slot-types";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import { InstrumentUtils } from "../../../utils/instrument.utils";
import { Quote } from "../../../../../shared/models/quotes/quote.model";
import { TranslatorFn } from "../../../../../shared/services/translator.service";

export class QuotesSourceNode extends NodeBase {
  readonly inputSlotName = 'instruments';
  readonly includePricePropertyName = 'includePrice';
  readonly includeVolumePropertyName = 'includeVolume';
  readonly includeLastUpdatePropertyName = 'includeLastUpdate';
  readonly includeBidAskPropertyName = 'includeBidAsk';
  readonly includeHighLowPropertyName = 'includeHighLow';
  readonly outputSlotName = 'quotes';

  private translatorFn?: Observable<TranslatorFn>;

  constructor() {
    super(QuotesSourceNode.title);
    this.setColorOption({
      color: NodeCategoryColors["info-sources"].headerColor,
      bgcolor: NodeCategoryColors["info-sources"].bodyColor,
      groupcolor: NodeCategoryColors["info-sources"].headerColor
    });

    this.addProperty(
      this.includePricePropertyName,
      true,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeVolumePropertyName,
      false,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeLastUpdatePropertyName,
      false,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeBidAskPropertyName,
      false,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeHighLowPropertyName,
      false,
      SlotType.Boolean
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
    return 'quotes';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    // Initialize translator function for data fields
    this.translatorFn = context.translatorService.getTranslator('ai-graph/data-fields');

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

        const instruments = this.toInstruments(targetInstruments ?? '');
        if (instruments.length === 0) {
          return of(false);
        }

        const includePrice = this.properties[this.includePricePropertyName] as boolean ?? true;
        const includeVolume = this.properties[this.includeVolumePropertyName] as boolean ?? false;
        const includeLastUpdate = this.properties[this.includeLastUpdatePropertyName] as boolean ?? false;
        const includeBidAsk = this.properties[this.includeBidAskPropertyName] as boolean ?? false;
        const includeHighLow = this.properties[this.includeHighLowPropertyName] as boolean ?? false;

        const quoteRequests = instruments.map(instrument =>
          context.quotesService.getLastQuoteInfo(instrument.symbol, instrument.exchange)
        );

        return forkJoin(quoteRequests).pipe(
          switchMap(quotes => {
            const validQuotes = quotes.filter((q): q is Quote => q !== null);

            return this.mergeToString(
              validQuotes,
              includePrice,
              includeVolume,
              includeLastUpdate,
              includeBidAsk,
              includeHighLow,
              instruments.length !== 1
            ).pipe(
              map(merged => {
                this.setOutputByName(
                  this.outputSlotName,
                  merged
                );
                return true;
              })
            );
          })
        );
      })
    );
  }

  private mergeToString(
    quotes: Quote[],
    includePrice: boolean,
    includeVolume: boolean,
    includeLastUpdate: boolean,
    includeBidAsk: boolean,
    includeHighLow: boolean,
    hasItemsForSeveralInstruments: boolean
  ): Observable<string> {
    if (!includePrice && !includeVolume && !includeLastUpdate && !includeBidAsk && !includeHighLow) {
      return of('');
    }

    return this.translatorFn!.pipe(
      take(1),
      map(t => {
        const merged = quotes.map(q => {
          const parts: string[] = [];

          if (includePrice) {
            const label = t(['fields', 'lastPrice', 'text']);
            parts.push(`${label}${q.last_price}`);
          }

          if (includeVolume) {
            const label = t(['fields', 'volume', 'text']);
            parts.push(`${label}${q.volume}`);
          }

          if (includeLastUpdate) {
            const label = t(['fields', 'lastUpdate', 'text']);
            parts.push(`${label}${new Date(q.last_price_timestamp * 1000).toISOString()}`);
          }

          if (includeBidAsk) {
            const label = t(['fields', 'bidAsk', 'text']);
            parts.push(`${label}${q.bid} (${q.bid_vol}) / ${q.ask} (${q.ask_vol})`);
          }

          if (includeHighLow) {
            const label = t(['fields', 'highLow', 'text']);
            parts.push(`${label}${q.high_price} / ${q.low_price}`);
          }

          const itemContent = parts.join('<br>');
          if (hasItemsForSeveralInstruments) {
            return `\n#### ${q.symbol} - ${q.description}\n${itemContent}`;
          }

          return itemContent;
        })
        .join(hasItemsForSeveralInstruments ? '<br>' : '<br><br>');

        return merged;
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
}
