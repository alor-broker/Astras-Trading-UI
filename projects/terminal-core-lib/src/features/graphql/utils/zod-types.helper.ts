import {
  z,
  ZodObject
} from 'zod/v3';

export type ZodPropertiesOf<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], z.ZodTypeDef, unknown>;
}>;

export type ZodSelectDefinition<T, K extends keyof T> = ZodPropertiesOf<Pick<T, K>>;

export type ZodDefinition<T, K extends keyof T> = ZodObject<ZodSelectDefinition<T, K>>;

export type Modify<TS, K extends keyof TS, TM> = Omit<Pick<TS, K>, keyof TM> & TM;
