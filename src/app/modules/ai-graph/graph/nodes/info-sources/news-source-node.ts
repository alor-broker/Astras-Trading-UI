import {Observable, of, switchMap, take} from "rxjs";
import {map} from "rxjs/operators";
import {NodeBase} from "../node-base";
import {InstrumentKey, SlotType} from "../../slot-types";
import {NodeCategories} from "../node-categories";
import {GraphProcessingContextService} from "../../../services/graph-processing-context.service";
import {DateValueValidationOptions, NumberValueValidationOptions} from "../models";
import {add, isBefore, parseISO, startOfDay} from "date-fns";
import {NewsListItem, NewsService} from "../../../../../shared/services/news.service";

export class NewsSourceNode extends NodeBase {
  readonly inputSlotName = 'instrument';
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
            return of(null);
          }

          const limit = this.properties[this.maxRecordsCountPropertyName] as number | undefined ?? 100;
          const fromDate = this.properties[this.fromDatePropertyName] as Date;

          return this.loadNews(targetInstrument, limit, context.newsService, fromDate);
        }
      ),
      map(items => {
          if (items == null) {
            return false;
          }

          const includeDate = this.properties[this.includeDatePropertyName] as boolean ?? false;
          const includeHeader = this.properties[this.includeHeaderPropertyName] as boolean ?? false;
          const includeContent = this.properties[this.includeContentPropertyName] as boolean ?? false;

          const merged = this.mergeToString(
            items,
            includeDate,
            includeHeader,
            includeContent
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
    includeContent: boolean
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

      return parts.join('<br>');
    })
      .join('<br><br>');

    return merged;
  }

  private loadNews(
    targetInstrument: InstrumentKey,
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
        symbols: [targetInstrument.symbol]
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
}
