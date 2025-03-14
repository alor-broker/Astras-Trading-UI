import {Observable, of, switchMap, take} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {InstrumentKey, SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {DateValueValidationOptions, NumberValueValidationOptions} from "../models";
import {add, isBefore, parseISO, startOfDay} from "date-fns";
import {NewsListItem, NewsService} from "../../../../../shared/services/news.service";
import {InstrumentUtils} from "../../../utils/instrument.utils";

export class NewsSourceNode extends NodeBase {
  readonly inputSlotName = 'instruments';
  readonly maxRecordsCountPropertyName = 'maxRecordsCount';
  readonly fromDatePropertyName = 'fromDate';
  readonly includeDatePropertyName = 'includeDate';
  readonly includeHeaderPropertyName = 'includeHeader';
  readonly includeContentPropertyName = 'includeContent';
  readonly outputSlotName = 'news';

  constructor() {
    super(NewsSourceNode.title);

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

    this.addProperty(
      this.includeDatePropertyName,
      false,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeHeaderPropertyName,
      true,
      SlotType.Boolean
    );

    this.addProperty(
      this.includeContentPropertyName,
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
    return 'news';
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
            return of(null);
          }

          const limit = this.properties[this.maxRecordsCountPropertyName] as number | undefined ?? 100;
          const fromDate = this.properties[this.fromDatePropertyName] as Date;
          const instruments = this.toInstruments(targetInstruments ?? '');

          return this.loadNews(instruments, limit, context.newsService, fromDate).pipe(
            map(items => (
              {
                items,
                instruments
              }
            ))
          );
        }
      ),
      map(x => {
          if (x?.items == null) {
            return false;
          }

          const includeDate = this.properties[this.includeDatePropertyName] as boolean ?? false;
          const includeHeader = this.properties[this.includeHeaderPropertyName] as boolean ?? false;
          const includeContent = this.properties[this.includeContentPropertyName] as boolean ?? false;

          const merged = this.mergeToString(
            x.items,
            includeDate,
            includeHeader,
            includeContent,
            x.instruments.length !== 1
          );

          this.setOutputByName(
            this.outputSlotName,
            merged
          );

          return true;
        }
      ));
  }

  private mergeToString(
    items: NewsListItem[],
    includeDate: boolean,
    includeHeader: boolean,
    includeContent: boolean,
    hasItemsForSeveralInstruments: boolean
  ): string {
    if (!includeDate && !includeHeader && !includeContent) {
      return '';
    }

    const merged = items.map(i => {
      const parts: string[] = [];

      if (includeDate) {
        parts.push(i.publishDate);
      }

      if (includeHeader) {
        parts.push(i.header);
      }

      if (includeContent) {
        parts.push(i.content);
      }

      const itemContent = parts.join('<br>');
      if (hasItemsForSeveralInstruments) {
        return `\n#### ${i.symbols.join(', ')}\n${itemContent}`;
      }

      return itemContent;
    })
      .join(hasItemsForSeveralInstruments ? '<br>' : '<br><br>');

    return merged;
  }

  private loadNews(
    targetInstruments: InstrumentKey[],
    limit: number,
    newsService: NewsService,
    fromDate?: Date,
  ): Observable<NewsListItem[]> {
    const state: {
      loadedItems: NewsListItem[];
      itemsIds: Set<string>;
    } = {
      loadedItems: [],
      itemsIds: new Set(),
    };

    const finishDate = startOfDay(fromDate ?? add(new Date(), {months: -1}));
    let offset = state.itemsIds.size;
    const batchLimit = Math.min(limit, 100);

    const loadBatch = (): Observable<NewsListItem[]> => {
      const itemsToRequest = Math.min(limit - state.itemsIds.size, batchLimit);

      return newsService.getNews({
        offset,
        limit: itemsToRequest,
        symbols: targetInstruments.map(i => i.symbol)
      }).pipe(
        switchMap(items => {
          if (items.length === 0) {
            return of(state.loadedItems);
          }

          for (const item of items) {
            if (state.itemsIds.has(item.id)) {
              continue;
            }

            const itemDate = parseISO(item.publishDate);
            if (isBefore(itemDate, finishDate)) {
              return of(state.loadedItems);
            }

            state.itemsIds.add(item.id);
            state.loadedItems.push(item);

            if (state.loadedItems.length >= limit) {
              return of(state.loadedItems);
            }
          }

          offset += itemsToRequest;
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
}
