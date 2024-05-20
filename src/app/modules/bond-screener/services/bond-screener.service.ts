import { Injectable } from '@angular/core';
import {
  Observable,
  take
} from "rxjs";
import {
  FetchPolicy,
  GraphQlService
} from "../../../shared/services/graph-ql.service";

import { DefaultTableFilters } from "../../../shared/models/settings/table-settings.model";
import {
  BondFilterInput,
  BondSortInput,
  Query,
  QueryBondsArgs,
  SortEnumType
} from "../../../../generated/graphql.types";
import { BondYield as BondYieldMod } from "../models/bond-yield-curve.model";
import { map } from "rxjs/operators";
import {
  GetBondsYieldCurveResponse,
  GetBondsYieldCurveResponseSchema
} from "./bond-yield-curve.gql-schemas";
import { GraphQlFilter } from "../../../shared/models/graph-ql.model";
import { getBondScreenerResponseSchema } from "./bond-screener.gql-schemas";
import { TypeOf } from "zod";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";
import { BondFilterInputSchema } from "../../../../generated/graphql.schemas";


@Injectable({
  providedIn: 'root'
})
export class BondScreenerService {

  constructor(
    private readonly graphQlService: GraphQlService
  ) {
  }

  getBonds(
    columnIds: string[],
    filters: DefaultTableFilters,
    params: { first: number, after?: string, sort: BondSortInput[] | null }
  ): Observable<Query | null> {
    const bondScreenerResponseSchema = getBondScreenerResponseSchema(columnIds);
    const parsedFilters = GraphQlHelper.parseToGqlFilters<BondFilterInput>(filters, BondFilterInputSchema());
    const couponsFilters = this.getCouponsFilters(filters);
    const offersFilters = this.getOffersFilters(filters);

    const args: QueryBondsArgs = {
      first: params.first,
      after: params.after,
      where: {
        and: [
          ...parsedFilters.and!,
          ...(couponsFilters == null ? [] : [{ coupons: couponsFilters }]),
          ...(offersFilters == null ? [] : [{ offers: offersFilters }]),
          ...(filters.hasAmortization == null ? [] : [{ amortizations: this.getAmortizationFilter(filters.hasAmortization as boolean) }])
        ]
      },
      order: params.sort
    };

    return this.graphQlService.watchQueryForSchema<TypeOf<typeof bondScreenerResponseSchema>>(
      bondScreenerResponseSchema,
      {
        first: args.first,
        where: { value: args.where, type: 'BondFilterInput' },
        order: { value: args.order, type: '[BondSortInput!]' },
      },
      { fetchPolicy: FetchPolicy.NoCache }
    ).pipe(
      take(1),
    );
  }

  getBondsYieldCurve(): Observable<BondYieldMod[] | null> {
    const now = new Date();
    now.setMinutes(0, 0, 0);

    const args: QueryBondsArgs = {
      first: 1000,
      where: {
        basicInformation: {
          // now only ОФЗ bonds are supported
          shortName: { startsWith: "ОФЗ" }
        },
        boardInformation: {
          isPrimaryBoard: { eq: true }
        },
        maturityDate: { gte: now.toISOString() },
        duration: { neq: null },
        durationMacaulay: { neq: null }
      },
      order: [
        {
          maturityDate: SortEnumType.Desc
        }
      ]
    };

    return this.graphQlService.watchQueryForSchema<GetBondsYieldCurveResponse>(
      GetBondsYieldCurveResponseSchema,
      {
        first: args.first,
        where: { value: args.where, type: 'BondFilterInput' },
        order: { value: args.order, type: '[BondSortInput!]' },
      },
      { fetchPolicy: FetchPolicy.NoCache }
    ).pipe(
      take(1),
      map(r => {
        if (!r) {
          return null;
        }

        return r.bonds.nodes.map(n => ({
          ...n,
          maturityDate: new Date(n.maturityDate)
        }));
      })
    );
  }

  // If closest coupon filters selected, filter by it
  private getCouponsFilters(filters: DefaultTableFilters): GraphQlFilter | null {
    const someFilters: GraphQlFilter[] = [];
    const noneFilters: GraphQlFilter[] = [];

    this.getFiltersOfArrayByDate(
      filters.couponDateFrom as string | undefined,
      filters.couponDateTo as string | undefined,
      someFilters,
      noneFilters
    );

    if (filters.couponIntervalInDaysFrom != null) {
      someFilters.push({ intervalInDays: { gte: Number(filters.couponIntervalInDaysFrom) } });
    }

    if (filters.couponIntervalInDaysTo != null) {
      someFilters.push({ intervalInDays: { lte: Number(filters.couponIntervalInDaysTo) } });
    }

    if (filters.couponAccruedInterestFrom != null) {
      someFilters.push({ accruedInterest: { gte: Number(filters.couponAccruedInterestFrom) } });
    }

    if (filters.couponAccruedInterestTo != null) {
      someFilters.push({ accruedInterest: { lte: Number(filters.couponAccruedInterestTo) } });
    }

    if (filters.couponAmountFrom != null) {
      someFilters.push({ amount: { gte: Number(filters.couponAmountFrom) } });
    }

    if (filters.couponAmountTo != null) {
      someFilters.push({ amount: { lte: Number(filters.couponAmountTo) } });
    }


    if (someFilters.length === 0 && noneFilters.length === 0) {
      return null;
    }

    if (noneFilters.length === 0) {
      return {
        some: { and: someFilters }
      };
    }

    return {
      some: { and: someFilters },
      none: { and: noneFilters }
    };
  }

  private getOffersFilters(filters: DefaultTableFilters): GraphQlFilter | null {
    const someFilters: GraphQlFilter[] = [];
    const noneFilters: GraphQlFilter[] = [];

    this.getFiltersOfArrayByDate(
      filters.offerDateFrom as string | undefined,
      filters.offerDateTo as string | undefined,
      someFilters,
      noneFilters
    );

    if (someFilters.length === 0 && noneFilters.length === 0) {
      return null;
    }

    if (noneFilters.length === 0) {
      return {
        some: { and: noneFilters }
      };
    }

    return {
      some: { and: someFilters },
      none: { and: noneFilters }
    };
  }

  private getAmortizationFilter(hasAmortization: boolean): GraphQlFilter {
    if (hasAmortization) {
      return {
        some: { date: { gte: new Date().toISOString() } }
      };
    } else {
      return {
        none: { date: { gte: new Date().toISOString() } }
      };
    }
  }

  private getFiltersOfArrayByDate(
    from: string | undefined,
    to: string | undefined,
    someFilters: GraphQlFilter[],
    noneFilters: GraphQlFilter[]
  ): void {
    if (from == null && to == null) {
      return;
    }

    const [fromDay, fromMonth, fromYear] = (from ?? '').split('.').map(d => Number(d));
    const [toDay, toMonth, toYear] = (to ?? '').split('.').map(d => Number(d));
    const dateFrom = new Date(fromYear, fromMonth - 1, fromDay);
    const dateTo = new Date(toYear, toMonth - 1, toDay);

    // If datFrom selected, search bonds with closest coupon by it
    if (!isNaN(dateFrom.getTime())) {
      noneFilters.push(
        {date: {gte: new Date().toISOString()}},
        {date: {lt: dateFrom.toISOString()}}
      );
      someFilters.push(
        {date: {gte: dateFrom.toISOString()}}
      );
    }

    // If datTo selected, search bonds with closest coupon by it
    if (!isNaN(dateTo.getTime())) {
      if (!isNaN(dateFrom.getTime())) { // If dateFrom selected, add filter by closest coupon before dateTo
        someFilters.push({
          date: {lte: dateTo.toISOString()}
        });
      } else {
        someFilters.push(
          {date: {gte: new Date().toISOString()}},
          {date: {lte: dateTo.toISOString()}}
        );
      }
    }
  }
}
