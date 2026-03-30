import { Injectable, inject } from '@angular/core';
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  GraphQlService,
  NamedClients
} from "./graph-ql.service";
import {
  PagedRequest,
  PagedResult
} from "../models/paging-model";
import {
  Modify,
  ZodPropertiesOf
} from "../utils/graph-ql/zod-helper";
import {
  object,
  TypeOf,
  ZodObject
} from "zod/v3";
import {
  NewsConnection,
  NewsFilterInput,
  PageInfo,
  Query,
  QueryNewsArgs
} from "../../../generated/news-graphql.types";
import { SortEnumType } from "../../../generated/graphql.types";
import {
  NewsSchema,
  PageInfoSchema
} from "../../../generated/news-graphql.schemas";
import { Variables } from "../utils/graph-ql/gql-query-builder";

interface GetNewsParams extends PagedRequest {
  symbols: string[] | null;
  includedKeywords: string[] | null;
  excludedKeywords: string[] | null;
}

export interface NewsListItem {
  id: string;
  header: string;
  publishDate: string;
  content: string;
  symbols: string[];
}

const newsScheme = NewsSchema().pick({
  id: true,
  headline: true,
  content: true,
  publishDate: true,
  symbols: true
});

type NewsType = TypeOf<typeof newsScheme>;

export type NewsConnectionType = Modify<
  NewsConnection,
  'nodes' | 'pageInfo',
  {
    nodes: NewsType[];
    pageInfo: PageInfo;
  }
>;

const NewsConnectionScheme: ZodObject<ZodPropertiesOf<NewsConnectionType>> = object({
  nodes: newsScheme.array(),
  pageInfo: PageInfoSchema()
});

type NewsSearchQueryType = Modify<
  Query,
  'news',
  {
    news: TypeOf<typeof NewsConnectionScheme>;
  }
>;

const NewsSearchQueryScheme: ZodObject<ZodPropertiesOf<NewsSearchQueryType>> = object({
  news: NewsConnectionScheme
});

export type NewsResponse = TypeOf<typeof NewsSearchQueryScheme>;

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly graphQlService = inject(GraphQlService);

  getNews(params: GetNewsParams): Observable<PagedResult<NewsListItem[]> | null> {
    const args: QueryNewsArgs = {
      order: [
        {
          publishDate: SortEnumType.Desc,
          id: SortEnumType.Desc
        }
      ]
    };

    if (params.afterCursor != null) {
      args.first = params.limit;
      args.after = params.afterCursor;
    } else if (params.beforeCursor != null) {
      args.last = params.limit;
      args.before = params.beforeCursor;
    } else {
      args.first = params.limit;
    }

    args.where = {
      and: []
    };

    if (params.symbols != null && params.symbols.length > 0) {
      args.where.and!.push({
          symbols: {
            in: params.symbols
          }
        }
      );
    }

    if (params.includedKeywords != null && params.includedKeywords.length > 0) {
      const includedKeywordsFilters: NewsFilterInput = {
        or: []
      };
      for (const keyword of params.includedKeywords) {
        includedKeywordsFilters.or!.push({
          headline: {
            contains: keyword
          }
        });
      }

      args.where.and!.push(includedKeywordsFilters);
    }

    if (params.excludedKeywords != null && params.excludedKeywords.length > 0) {
      for (const keyword of params.excludedKeywords) {
        args.where.and!.push({
          headline: {
            ncontains: keyword
          }
        });
      }
    }

    const variables: Variables = {
      order: {value: args.order, type: '[NewsSortInput!]'},
    };

    if (args.first != null) {
      variables.first = args.first;
    }

    if (args.last != null) {
      variables.last = args.last;
    }

    if (args.after != null) {
      variables.after = args.after;
    }

    if (args.before != null) {
      variables.before = args.before;
    }

    if (args.where != null) {
      variables.where = {value: args.where, type: 'NewsFilterInput'};
    }

    return this.graphQlService.queryForSchema<NewsResponse>(
      NewsSearchQueryScheme,
      variables,
      {
        clientName: NamedClients.News
      }
    ).pipe(
      map(r => {
        if (r == null) {
          return r;
        }

        return {
          data: r.news.nodes.map(i => {
            return {
              id: i.id.toString(),
              header: i.headline!,
              content: i.content!,
              publishDate: i.publishDate!,
              symbols: i.symbols?.split(',') ?? []
            };
          }),
          hasNextPage: r.news.pageInfo.hasNextPage,
          hasPreviousPage: r.news.pageInfo.hasPreviousPage,
          startCursor: r.news.pageInfo.startCursor ?? null,
          endCursor: r.news.pageInfo.endCursor ?? null
        };
      })
    );
  }
}
