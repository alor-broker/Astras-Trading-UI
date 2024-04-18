import { z } from "zod";
import { ZodProperties } from "./zod-helper";
import { Query } from "../../../../generated/graphql.types";
import {
  BondSchema,
  BondsConnectionSchema,
  DerivativeSchema,
  DerivativesConnectionSchema,
  InstrumentSchema,
  InstrumentsConnectionSchema,
  StockSchema,
  StocksConnectionSchema
} from "../../../../generated/graphql.schemas";

export const QuerySchema: z.ZodObject<ZodProperties<Query>> = z.object({
  bond: BondSchema().nullish(),
  bonds: BondsConnectionSchema().nullish(),
  derivative: DerivativeSchema().nullish(),
  derivatives: DerivativesConnectionSchema().nullish(),
  instrument: InstrumentSchema().nullish(),
  instruments: InstrumentsConnectionSchema().nullish(),
  stock: StockSchema().nullish(),
  stocks: StocksConnectionSchema().nullish(),
});
