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

export enum IdeaResponseFormat {
  HtmlBody = 'html_body',
  StructuredJson = 'structured_json',
}

export interface IdeaHtmlBodyResponse {
  format: IdeaResponseFormat.HtmlBody;
  title: string;
  body: string;
}

export interface IdeaStructuredResponse {
  format: IdeaResponseFormat.StructuredJson;
  id: string;
  title: string;
  description: string;
  ticker: string;
  exchange: string;
  company: string;
  forecast: string;
  buyPrice: string;
  sellPrice: string;
  validUntil: string;
}

export type IdeaResponse = IdeaHtmlBodyResponse | IdeaStructuredResponse;

export interface PageState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface IdeasPagedResponse extends PageState {
  list: IdeaResponse[];
}

export interface InvestIdeasUrlProvider {
  get investIdeasApiUrl(): string;
}

export const INVEST_IDEAS_URL_PROVIDER = new InjectionToken<InvestIdeasUrlProvider>('InvestIdeasUrlProvider');
