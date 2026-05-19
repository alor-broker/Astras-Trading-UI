import {InjectionToken} from '@angular/core';

export interface Page {
  pageNum: number;
  pageSize: number;
}

export interface IdeaSymbol {
  ticker: string;
  exchange: string;
  shortName?: string;
}

export interface Idea {
  title: string;
  body: string;
  symbols: IdeaSymbol[];
}

export interface PageState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface IdeasPagedResponse extends PageState {
  list: Idea[];
}

export interface InvestIdeasUrlProvider {
  get investIdeasApiUrl(): string;
}

export const INVEST_IDEAS_URL_PROVIDER = new InjectionToken<InvestIdeasUrlProvider>('InvestIdeasUrlProvider');
