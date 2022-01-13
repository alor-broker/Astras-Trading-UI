export interface SearchFilter {
  query: string,
  limit: number,
  sector?: string,
  cficode?: string,
  exchange?: string,
  instrumentGroup?: string
}
