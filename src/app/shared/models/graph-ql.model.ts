export interface GraphQlEdge<T> {
  node: T;
  cursor?: string;
}

export interface GraphQlPageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface GraphQlFilters {
  and?: (GraphQlFilter | GraphQlFilters)[];
  or?: (GraphQlFilter | GraphQlFilters)[];
}

export interface GraphQlFilter {
  [filterName: string]: GraphQlCondition | GraphQlFilter | GraphQlFilters;
}

export interface GraphQlCondition {
  [conditionType: string]: unknown;
}

export interface GraphQlSort {
  [sortField: string]: GraphQlSort | GraphQlSortType;
}

export enum GraphQlSortType {
  ASC = 'ASC',
  DESC = 'DESC'
}
