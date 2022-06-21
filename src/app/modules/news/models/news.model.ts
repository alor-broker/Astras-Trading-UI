export interface NewsListItem {
  id: number,
  sourceId: string,
  header: string,
  publishDate: string,
  newsType: number,
  content:  string,
  countryCodes: Array<string>,
  rubricCodes: Array<string>,
  symbols: Array<string>,
  mt: null
}

export interface NewsItemInfo {
  id: number;
  title: string;
  desc: string;
  pubDate: string;
}
