import { Injectable, inject } from '@angular/core';
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
  BondsConnection,
  BondSortInput,
  CouponFilterInput,
  ListFilterInputTypeOfAmortizationFilterInput,
  ListFilterInputTypeOfCouponFilterInput,
  ListFilterInputTypeOfOfferFilterInput,
  OfferFilterInput,
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
import { getBondScreenerResponseSchema } from "./bond-screener.gql-schemas";
import { TypeOf } from "zod";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";
import { BondFilterInputSchema } from "../../../../generated/graphql.schemas";

@Injectable({
  providedIn: 'root'
})
export class BondScreenerService {
  private readonly graphQlService = inject(GraphQlService);

  getBonds(
    columnIds: string[],
    filters: DefaultTableFilters,
    params: { first: number, after?: string, sort: BondSortInput[] | null }
  ): Observable<BondsConnection | null> {
    const bondScreenerResponseSchema = getBondScreenerResponseSchema(columnIds);
    const parsedFilters = GraphQlHelper.parseToGqlFiltersIntersection<BondFilterInput>(filters, BondFilterInputSchema());
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

    return this.graphQlService.queryForSchema<TypeOf<typeof bondScreenerResponseSchema>>(
      bondScreenerResponseSchema,
      {
        first: args.first,
        after: args.after,
        where: { value: args.where, type: 'BondFilterInput' },
        order: { value: args.order, type: '[BondSortInput!]' },
      },
      { fetchPolicy: FetchPolicy.NoCache }
    ).pipe(
      take(1),
      map(q => (q as Query)?.bonds ?? null)
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

    return this.graphQlService.queryForSchema<GetBondsYieldCurveResponse>(
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
  private getCouponsFilters(filters: DefaultTableFilters): ListFilterInputTypeOfCouponFilterInput | null {
    const filtersByDate = this.getFiltersOfArrayByDate<CouponFilterInput>(
      filters.couponDateFrom as string,
      filters.couponDateTo as string
    );

    const someFilters = filtersByDate.some;
    const noneFilters = filtersByDate.none;

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

    someFilters.push({
      isClosest: { eq: true }
    });

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

  private getOffersFilters(filters: DefaultTableFilters): ListFilterInputTypeOfOfferFilterInput | null {
    const filtersByDate = this.getFiltersOfArrayByDate<OfferFilterInput>(
      filters.offerDateFrom as string,
      filters.offerDateTo as string
    );

    const someFilters = filtersByDate.some;
    const noneFilters = filtersByDate.none;

    if (someFilters.length === 0 && noneFilters.length === 0) {
      return null;
    }

    someFilters.push({
      isClosest: { eq: true }
    });

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

  private getAmortizationFilter(hasAmortization: boolean): ListFilterInputTypeOfAmortizationFilterInput {
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

  private getFiltersOfArrayByDate<T>(
    from: string | null,
    to: string | null,
  ): { some: T[], none: T[] } {
    if (from == null && to == null) {
      return { some: [], none: [] };
    }

    const someFilters: T[] = [];
    const noneFilters: T[] = [];

    const [fromDay, fromMonth, fromYear] = (from ?? '').split('.').map(d => Number(d));
    const [toDay, toMonth, toYear] = (to ?? '').split('.').map(d => Number(d));
    const dateFrom = new Date(fromYear, fromMonth - 1, fromDay);
    const dateTo = new Date(toYear, toMonth - 1, toDay);

    // If datFrom selected, search bonds with closest coupon by it
    if (!isNaN(dateFrom.getTime())) {
      noneFilters.push(
        { date: { gte: new Date().toISOString() } } as T,
        { date: { lt: dateFrom.toISOString() } } as T
      );
      someFilters.push(
        { date: { gte: dateFrom.toISOString() } } as T
      );
    }

    // If datTo selected, search bonds with closest coupon by it
    if (!isNaN(dateTo.getTime())) {
      if (!isNaN(dateFrom.getTime())) { // If dateFrom selected, add filter by closest coupon before dateTo
        someFilters.push({
          date: { lte: dateTo.toISOString() }
        } as T);
      } else {
        someFilters.push(
          { date: { gte: new Date().toISOString() } } as T,
          { date: { lte: dateTo.toISOString() } } as T
        );
      }
    }

    return { some: someFilters, none: noneFilters };
  }
}
