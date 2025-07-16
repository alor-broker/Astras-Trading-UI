import { NodeBase } from "../node-base";
import {
  NodeCategories,
  NodeCategoryColors
} from "../node-categories";
import {
  InstrumentKey,
  Portfolio,
  SlotType
} from "../../slot-types";
import {
  DateValueValidationOptions,
  NumberValueValidationOptions
} from "../models";
import {
  add,
  formatISO,
  isBefore,
  startOfDay
} from "date-fns";
import { GraphProcessingContextService } from "../../../services/graph-processing-context.service";
import {
  forkJoin,
  Observable,
  of,
  switchMap,
  take
} from "rxjs";
import { map } from "rxjs/operators";
import { mergeArrays } from "../../../../../shared/utils/collections";
import { InstrumentUtils } from "../../../utils/instrument.utils";
import { PortfolioUtils } from "../../../utils/portfolio.utils";
import { StringHelper } from "../../../../../shared/utils/string-helper";
import { TradesHistoryService } from "../../../../../shared/services/trades-history.service";
import { Trade } from "../../../../../shared/models/trades/trade.model";
import { TranslatorFn } from "../../../../../shared/services/translator.service";

export class PortfolioTradesSourceNode extends NodeBase {
  private translatorFn?: Observable<TranslatorFn>;
  readonly instrumentsSlotName = 'instruments';

  readonly portfolioSlotName = 'portfolio';

  readonly outputSlotName = 'trades';

  readonly maxRecordsCountPropertyName = 'maxRecordsCount';

  readonly fromDatePropertyName = 'fromDate';

  constructor() {
    super(PortfolioTradesSourceNode.title);
    this.setColorOption({
      color: NodeCategoryColors["info-sources"].headerColor,
      bgcolor: NodeCategoryColors["info-sources"].bodyColor,
      groupcolor: NodeCategoryColors["info-sources"].headerColor
    });

    this.addInput(
      this.instrumentsSlotName,
      SlotType.InstrumentsStr,
      {
        nameLocked: true,
        removable: false
      }
    );

    this.addInput(
      this.portfolioSlotName,
      SlotType.Portfolio,
      {
        nameLocked: true,
        removable: false
      }
    );

    this.addProperty(
      this.maxRecordsCountPropertyName,
      100,
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

    this.addProperty(
      this.fromDatePropertyName,
      null,
      SlotType.Date,
      {
        validation: {
          min: add(
            new Date(),
            {
              years: -1
            }
          ),
          allowFuture: false,
          required: false
        } as DateValueValidationOptions
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
    return 'trades';
  }

  static get nodeCategory(): NodeCategories {
    return NodeCategories.InfoSources;
  }

  override executor(context: GraphProcessingContextService): Observable<boolean> {
    this.translatorFn = context.translatorService.getTranslator('ai-graph/data-fields');

    return super.executor(context).pipe(
      switchMap(() => {
          const portfolioKeyString = this.getValueOfInput(this.portfolioSlotName) as string | undefined;
          if (portfolioKeyString === undefined || portfolioKeyString === null || portfolioKeyString.length === 0) {
            return of(null);
          }

          const targetPortfolio = PortfolioUtils.fromString(portfolioKeyString);

          if (targetPortfolio == null
            || StringHelper.isNullOrEmpty(targetPortfolio.agreement)
            || StringHelper.isNullOrEmpty(targetPortfolio.market)
          ) {
            return of(null);
          }

          const targetInstruments = this.getValueOfInput(this.instrumentsSlotName) as string | undefined;
          const inputDescriptor = this.findInputSlot(this.instrumentsSlotName, true);
          if (
            inputDescriptor?.link != null
            && (targetInstruments == null || targetInstruments.length === 0)
          ) {
            return of(null);
          }
          const instruments = this.toInstruments(targetInstruments ?? '');

          const limit = this.properties[this.maxRecordsCountPropertyName] as number | undefined ?? 100;
          const fromDate = this.properties[this.fromDatePropertyName] as Date;

          if (instruments.length === 0) {
            return of(null);
          }

          return forkJoin(instruments.map(i => this.loadTrades(targetPortfolio, i, limit, context.tradesHistoryService, fromDate))).pipe(
            map(items => mergeArrays(items))
          );
        }
      ),
      switchMap(x => {
          if (x == null) {
            return of(false);
          }

        return this.translatorFn!.pipe(
          take(1),
          map(t => {
            this.setOutputByName(this.outputSlotName, this.mergeToString(x, t));
            return true;
          })
        );
        }
      ));
  }

  private loadTrades(
    portfolio: Portfolio,
    targetInstrument: InstrumentKey,
    limit: number,
    tradesHistoryService: TradesHistoryService,
    fromDate?: Date,
  ): Observable<Trade[]> {
    const state: {
      loadedItems: Trade[];
      itemsIds: Set<string>;
    } = {
      loadedItems: [],
      itemsIds: new Set(),
    };

    const finishDate = startOfDay(fromDate ?? add(new Date(), {months: -1}));
    const batchLimit = Math.min(limit, 100);
    let from: string | null = null;

    const loadBatch = (): Observable<Trade[]> => {
      const itemsToRequest = Math.min(limit - state.itemsIds.size, batchLimit);

      return tradesHistoryService.getTradesHistoryForSymbol(
        portfolio.exchange,
        portfolio.portfolio,
        targetInstrument.symbol,
        {
          limit: itemsToRequest,
          from
        }
      ).pipe(
        switchMap(result => {
          if (result == null) {
            return of(state.loadedItems);
          }

          if (result.length === 0) {
            return of(state.loadedItems);
          }

          for (const item of result) {
            if (state.itemsIds.has(item.id)) {
              continue;
            }

            if (isBefore(item.date, finishDate)) {
              return of(state.loadedItems);
            }

            state.itemsIds.add(item.id);
            state.loadedItems.push(item);

            if (state.loadedItems.length >= limit) {
              return of(state.loadedItems);
            }
          }

          if(result.length < itemsToRequest) {
            return of(state.loadedItems);
          }

          from = state.loadedItems[state.loadedItems.length - 1].id;

          return loadBatch();
        }),
        take(1),
      );
    };

    return loadBatch();
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

  private mergeToString(
    items: Trade[],
    translator: TranslatorFn
  ): string {
    const symbolLabel = translator(['fields', 'symbol', 'text']);
    const exchangeLabel = translator(['fields', 'exchange', 'text']);
    const dateLabel = translator(['fields', 'date', 'text']);
    const qtyLabel = translator(['fields', 'qty', 'text']);
    const price = translator(['fields', 'price', 'text']);
    const sideLabel = translator(['fields', 'side', 'text']);

    const merged = items.map((trade: Trade) => {
      return [
        `${symbolLabel} ${trade.targetInstrument.symbol}`,
        `${exchangeLabel} ${trade.targetInstrument.exchange}`,
        `${dateLabel} ${formatISO(trade.date)}`,
        `${qtyLabel} ${trade.qty}`,
        `${price} ${trade.price}`,
        `${sideLabel} ${trade.side}`,
      ].join('<br>');
    }).join('<br><br>');

    return merged;
  }
}
