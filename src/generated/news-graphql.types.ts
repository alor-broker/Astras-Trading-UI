/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  Long: { input: number; output: number; }
}

export interface DateTimeOperationFilterInput {
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
  ngt?: InputMaybe<Scalars['DateTime']['input']>;
  ngte?: InputMaybe<Scalars['DateTime']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  nlt?: InputMaybe<Scalars['DateTime']['input']>;
  nlte?: InputMaybe<Scalars['DateTime']['input']>;
}

export interface LongOperationFilterInput {
  eq?: InputMaybe<Scalars['Long']['input']>;
  gt?: InputMaybe<Scalars['Long']['input']>;
  gte?: InputMaybe<Scalars['Long']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  lt?: InputMaybe<Scalars['Long']['input']>;
  lte?: InputMaybe<Scalars['Long']['input']>;
  neq?: InputMaybe<Scalars['Long']['input']>;
  ngt?: InputMaybe<Scalars['Long']['input']>;
  ngte?: InputMaybe<Scalars['Long']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['Long']['input']>>>;
  nlt?: InputMaybe<Scalars['Long']['input']>;
  nlte?: InputMaybe<Scalars['Long']['input']>;
}

export interface News {
  content?: Maybe<Scalars['String']['output']>;
  geoList?: Maybe<Scalars['String']['output']>;
  headline?: Maybe<Scalars['String']['output']>;
  id: Scalars['Long']['output'];
  mt?: Maybe<Scalars['String']['output']>;
  publishDate: Scalars['DateTime']['output'];
  rubrics?: Maybe<Scalars['String']['output']>;
  sourceId?: Maybe<Scalars['String']['output']>;
  symbols?: Maybe<Scalars['String']['output']>;
  urgencyCode?: Maybe<Scalars['String']['output']>;
}

/** A connection to a list of items. */
export interface NewsConnection {
  /** A list of edges. */
  edges?: Maybe<Array<NewsEdge>>;
  /** A flattened list of the nodes. */
  nodes?: Maybe<Array<Maybe<News>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
}

/** An edge in a connection. */
export interface NewsEdge {
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<News>;
}

export interface NewsFilterInput {
  and?: InputMaybe<Array<NewsFilterInput>>;
  content?: InputMaybe<StringOperationFilterInput>;
  geoList?: InputMaybe<StringOperationFilterInput>;
  headline?: InputMaybe<StringOperationFilterInput>;
  id?: InputMaybe<LongOperationFilterInput>;
  mt?: InputMaybe<StringOperationFilterInput>;
  or?: InputMaybe<Array<NewsFilterInput>>;
  publishDate?: InputMaybe<DateTimeOperationFilterInput>;
  rubrics?: InputMaybe<StringOperationFilterInput>;
  sourceId?: InputMaybe<StringOperationFilterInput>;
  symbols?: InputMaybe<StringOperationFilterInput>;
  urgencyCode?: InputMaybe<StringOperationFilterInput>;
}

export interface NewsSortInput {
  content?: InputMaybe<SortEnumType>;
  geoList?: InputMaybe<SortEnumType>;
  headline?: InputMaybe<SortEnumType>;
  id?: InputMaybe<SortEnumType>;
  mt?: InputMaybe<SortEnumType>;
  publishDate?: InputMaybe<SortEnumType>;
  rubrics?: InputMaybe<SortEnumType>;
  sourceId?: InputMaybe<SortEnumType>;
  symbols?: InputMaybe<SortEnumType>;
  urgencyCode?: InputMaybe<SortEnumType>;
}

/** Information about pagination in a connection. */
export interface PageInfo {
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates whether more edges exist following the set defined by the clients arguments. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Indicates whether more edges exist prior the set defined by the clients arguments. */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
}

export interface Query {
  news?: Maybe<NewsConnection>;
}


export interface QueryNewsArgs {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<Array<NewsSortInput>>;
  where?: InputMaybe<NewsFilterInput>;
}

export enum SortEnumType {
  Asc = 'ASC',
  Desc = 'DESC'
}

export interface StringOperationFilterInput {
  and?: InputMaybe<Array<StringOperationFilterInput>>;
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  ncontains?: InputMaybe<Scalars['String']['input']>;
  nendsWith?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  nstartsWith?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<StringOperationFilterInput>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
}
