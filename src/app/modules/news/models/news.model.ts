export interface NewsList {
  list: NewsListItem[];
  total: number;
}

export interface NewsListItem {
  id: number;
  title: string;
  pubDate: string;
}

export interface NewsItemInfo {
  id: number;
  title: string;
  desc: string;
  pubDate: string;
}
