export interface OrderFilter {
  id?: string;
  symbol?: string;
  [key: string]: string | string[] | undefined;
}
