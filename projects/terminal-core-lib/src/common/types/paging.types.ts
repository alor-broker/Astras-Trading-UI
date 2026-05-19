export interface CursorPagedRequest {
  limit: number;
  afterCursor?: string | null;
  beforeCursor?: string | null;
}

export interface CursorPagedResult<T> {
  data: T;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
