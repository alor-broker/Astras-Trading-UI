export interface ReleaseMeta {
  id: string;
  createdAt: number;
  summary: string;
  description: string;
}

export interface ReleasesMeta {
  list: ReleaseMeta[];
}
