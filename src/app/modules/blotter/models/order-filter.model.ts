export interface OrderFilter {
  id?: string,
  symbol?: string,
  [key: string]: string | undefined
}


export interface DefaultFilter {
  [filterName: string]: string[] | undefined;
}
