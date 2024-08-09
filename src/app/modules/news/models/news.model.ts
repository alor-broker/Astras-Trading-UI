export interface NewsListItem {
  id: string;
  sourceId: string;
  header: string;
  publishDate: string;
  newsType: number;
  content: string;
  countryCodes: string[];
  rubricCodes: string[];
  symbols: string[];
  mt: null;
}

export interface NewsItemInfo {
  id: number;
  title: string;
  desc: string;
  pubDate: string;
}

export enum NewsSection {
  All = 'all',
  Portfolio = 'portfolio',
  Symbol = 'symbol'
}
