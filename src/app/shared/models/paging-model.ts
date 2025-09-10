export interface PagedRequest {
  limit: number;
  afterCursor?: string | null;
  beforeCursor?: string | null;
}

export interface PagedResult<T> {
  data: T;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
