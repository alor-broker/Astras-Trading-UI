/* eslint-disable */
import { z } from 'zod/v3'
import { DateTimeOperationFilterInput, LongOperationFilterInput, News, NewsConnection, NewsEdge, NewsFilterInput, NewsSortInput, PageInfo, SortEnumType, StringOperationFilterInput } from './news-graphql.types'

type Properties<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any, T[K]>;
}>;

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny => v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const SortEnumTypeSchema = z.nativeEnum(SortEnumType);

export function DateTimeOperationFilterInputSchema(): z.ZodObject<Properties<DateTimeOperationFilterInput>> {
  return z.object({
    eq: z.string().nullish(),
    gt: z.string().nullish(),
    gte: z.string().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    lt: z.string().nullish(),
    lte: z.string().nullish(),
    neq: z.string().nullish(),
    ngt: z.string().nullish(),
    ngte: z.string().nullish(),
    nin: z.array(z.string().nullable()).nullish(),
    nlt: z.string().nullish(),
    nlte: z.string().nullish()
  })
}

export function LongOperationFilterInputSchema(): z.ZodObject<Properties<LongOperationFilterInput>> {
  return z.object({
    eq: z.number().nullish(),
    gt: z.number().nullish(),
    gte: z.number().nullish(),
    in: z.array(z.number().nullable()).nullish(),
    lt: z.number().nullish(),
    lte: z.number().nullish(),
    neq: z.number().nullish(),
    ngt: z.number().nullish(),
    ngte: z.number().nullish(),
    nin: z.array(z.number().nullable()).nullish(),
    nlt: z.number().nullish(),
    nlte: z.number().nullish()
  })
}

export function NewsSchema(): z.ZodObject<Properties<News>> {
  return z.object({
    __typename: z.literal('News').optional(),
    content: z.string().nullish(),
    geoList: z.string().nullish(),
    headline: z.string().nullish(),
    id: z.number(),
    mt: z.string().nullish(),
    publishDate: z.string(),
    rubrics: z.string().nullish(),
    sourceId: z.string().nullish(),
    symbols: z.string().nullish(),
    urgencyCode: z.string().nullish()
  })
}

export function NewsConnectionSchema(): z.ZodObject<Properties<NewsConnection>> {
  return z.object({
    __typename: z.literal('NewsConnection').optional(),
    edges: z.array(z.lazy(() => NewsEdgeSchema())).nullish(),
    nodes: z.array(z.lazy(() => NewsSchema().nullable())).nullish(),
    pageInfo: z.lazy(() => PageInfoSchema()),
    totalCount: z.number()
  })
}

export function NewsEdgeSchema(): z.ZodObject<Properties<NewsEdge>> {
  return z.object({
    __typename: z.literal('NewsEdge').optional(),
    cursor: z.string(),
    node: z.lazy(() => NewsSchema().nullish())
  })
}

export function NewsFilterInputSchema(): z.ZodObject<Properties<NewsFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => NewsFilterInputSchema())).nullish(),
    content: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    geoList: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    headline: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    id: z.lazy(() => LongOperationFilterInputSchema().nullish()),
    mt: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    or: z.array(z.lazy(() => NewsFilterInputSchema())).nullish(),
    publishDate: z.lazy(() => DateTimeOperationFilterInputSchema().nullish()),
    rubrics: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    sourceId: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    symbols: z.lazy(() => StringOperationFilterInputSchema().nullish()),
    urgencyCode: z.lazy(() => StringOperationFilterInputSchema().nullish())
  })
}

export function NewsSortInputSchema(): z.ZodObject<Properties<NewsSortInput>> {
  return z.object({
    content: SortEnumTypeSchema.nullish(),
    geoList: SortEnumTypeSchema.nullish(),
    headline: SortEnumTypeSchema.nullish(),
    id: SortEnumTypeSchema.nullish(),
    mt: SortEnumTypeSchema.nullish(),
    publishDate: SortEnumTypeSchema.nullish(),
    rubrics: SortEnumTypeSchema.nullish(),
    sourceId: SortEnumTypeSchema.nullish(),
    symbols: SortEnumTypeSchema.nullish(),
    urgencyCode: SortEnumTypeSchema.nullish()
  })
}

export function PageInfoSchema(): z.ZodObject<Properties<PageInfo>> {
  return z.object({
    __typename: z.literal('PageInfo').optional(),
    endCursor: z.string().nullish(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    startCursor: z.string().nullish()
  })
}

export function StringOperationFilterInputSchema(): z.ZodObject<Properties<StringOperationFilterInput>> {
  return z.object({
    and: z.array(z.lazy(() => StringOperationFilterInputSchema())).nullish(),
    contains: z.string().nullish(),
    endsWith: z.string().nullish(),
    eq: z.string().nullish(),
    in: z.array(z.string().nullable()).nullish(),
    ncontains: z.string().nullish(),
    nendsWith: z.string().nullish(),
    neq: z.string().nullish(),
    nin: z.array(z.string().nullable()).nullish(),
    nstartsWith: z.string().nullish(),
    or: z.array(z.lazy(() => StringOperationFilterInputSchema())).nullish(),
    startsWith: z.string().nullish()
  })
}
