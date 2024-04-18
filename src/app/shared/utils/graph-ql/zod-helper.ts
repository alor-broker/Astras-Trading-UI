import {
  z,
  ZodObject
} from "zod";

export type PropertiesOf<T> = Required<{
  [K in keyof T]: z.ZodType<T[K], any>;
}>;

export type SelectDefinition<T, K extends keyof T> = PropertiesOf<Pick<T, K>>;

export type ZodDefinition<T, K extends keyof T> = ZodObject<SelectDefinition<T, K>>;

export type Modify<T, R> = Omit<T, keyof R> & R;
