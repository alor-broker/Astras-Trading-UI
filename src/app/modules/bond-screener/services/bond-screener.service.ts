import { Injectable } from '@angular/core';
import {
  Observable,
  take
} from "rxjs";
import { BondScreenerResponse } from "../models/bond-screener.model";
import {
  FetchPolicy,
  GraphQlService
} from "../../../shared/services/graph-ql.service";

import { DefaultTableFilters } from "../../../shared/models/settings/table-settings.model";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";
import {
  QueryBondsArgs,
  SortEnumType
} from "../../../../generated/graphql.types";
import { BondYield as BondYieldMod } from "../models/bond-yield-curve.model";
import { map } from "rxjs/operators";
import {
  GetBondsYieldCurveResponse,
  GetBondsYieldCurveResponseSchema
} from "./bond-screener.gql-schemas";
import { GraphQlFilter, GraphQlSort } from "../../../shared/models/graph-ql.model";

const BOND_NESTED_FIELDS: { [fieldName: string]: string[] } = {
  basicInformation: ['symbol', 'shortName', 'exchange'],
  financialAttributes: ['tradingStatusInfo'],
  additionalInformation: ['cancellation', 'priceMultiplier'],
  boardInformation: ['board'],
  yield: ['currentYield'],
  tradingDetails: ['lotSize', 'minStep', 'price', 'priceMax', 'priceMin', 'priceStep', 'rating'],
  volumes: ['issueValue'],
  coupons: ['accruedInterest', 'amount', 'date', 'intervalInDays', 'value'],
  offers: ['date'],
  rootFields: ['couponRate', 'couponType', 'guaranteed', 'hasOffer', 'maturityDate', 'placementEndDate', 'duration', 'durationMacaulay']
};

const BOND_FILTER_TYPES: { [fieldName: string]: string[] } = {
  search: ['symbol', 'shortName', 'board'],
  multiSelect: ['exchange', 'couponType'],
  interval: [
    'priceMultiplierFrom',
    'priceMultiplierTo',
    'couponRateFrom',
    'couponRateTo',
    'currentYieldFrom',
    'currentYieldTo',
    'issueValueFrom',
    'issueValueTo',
    'lotSizeFrom',
    'lotSizeTo',
    'minStepFrom',
    'minStepTo',
    'priceFrom',
    'priceTo',
    'priceMaxFrom',
    'priceMaxTo',
    'priceMinFrom',
    'priceMinTo',
    'priceStepFrom',
    'priceStepTo',
    'durationFrom',
    'durationTo',
    'durationMacaulayFrom',
    'durationMacaulayTo',
  ],
  bool: ['guaranteed', 'hasOffer'],
  date: [
    'cancellationTo',
    'cancellationFrom',
    'maturityDateTo',
    'maturityDateFrom',
    'placementEndDateTo',
    'placementEndDateFrom'
  ]
};

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
    params: { first: number, after?: string, sort: GraphQlSort | null }
  ): Observable<BondScreenerResponse | null> {
    const couponsFilters = this.getCouponsFilters(filters);
    const offersFilters = this.getOffersFilters(filters);

    return this.graphQlService.watchQuery(
      this.getBondsQuery(columnIds),
      {
        ...params,
        filters: {
          and: [
            ...GraphQlHelper.parseFilters(filters, BOND_NESTED_FIELDS, BOND_FILTER_TYPES).and!,
            ...(couponsFilters == null ? [] : [{ coupons: couponsFilters }]),
            ...(offersFilters == null ? [] : [{ offers: offersFilters }]),
            ...(filters.hasAmortization == null ? [] : [{ amortizations: this.getAmortizationFilter(filters.hasAmortization as boolean) }])
          ]
        }
      }
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

  private getBondsQuery(columnIds: string[]): string {
    const basicInformationFields = BOND_NESTED_FIELDS.basicInformation.filter(f => columnIds.includes(f) || f === 'symbol' || f === 'exchange');
    const additionalInformationFields = BOND_NESTED_FIELDS.additionalInformation.filter(f => columnIds.includes(f));
    const financialAttributesFields = BOND_NESTED_FIELDS.financialAttributes.filter(f => columnIds.includes(f));
    const boardInformationFields = BOND_NESTED_FIELDS.boardInformation.filter(f => columnIds.includes(f));
    const tradingDetailsFields = BOND_NESTED_FIELDS.tradingDetails.filter(f => columnIds.includes(f));
    const volumesFields = BOND_NESTED_FIELDS.volumes.filter(f => columnIds.includes(f));
    const yieldFields = BOND_NESTED_FIELDS.yield.filter(f => columnIds.includes(f));
    const couponsFields = BOND_NESTED_FIELDS.coupons.filter(f => columnIds.map(id =>
      id.replace('coupon', '').toLowerCase()).includes(f.toLowerCase()) ||
      f === 'date'
    );
    const offersFields = BOND_NESTED_FIELDS.offers.filter(f => columnIds.map(id =>
      id.replace('offer', '').toLowerCase()).includes(f.toLowerCase()) ||
      f === 'date'
    );
    const rootFields = BOND_NESTED_FIELDS.rootFields.filter(f => columnIds.includes(f));

    return `query GET_BONDS($first: Int, $after: String, $filters: BondFilterInput, $sort: [BondSortInput!]) {
            bonds(
              first: $first,
              after: $after,
              where: $filters,
              order: $sort
              ) {
              edges {
                node {
                  basicInformation { ${basicInformationFields.join(' ')} }
                  ${additionalInformationFields.length > 0
      ? 'additionalInformation {' + additionalInformationFields.join(' ') + '}'
      : ''
    }
                  ${financialAttributesFields.length > 0
      ? 'financialAttributes {' + financialAttributesFields.join(' ') + '}'
      : ''
    }
                  ${boardInformationFields.length > 0
      ? 'boardInformation {' + boardInformationFields.join(' ') + '}'
      : ''
    }
                  ${tradingDetailsFields.length > 0
      ? 'tradingDetails {' + tradingDetailsFields.join(' ') + '}'
      : ''
    }
                  ${volumesFields.length > 0
      ? 'volumes {' + volumesFields.join(' ') + '}'
      : ''
    }
                  ${yieldFields.length > 0
      ? 'yield {' + yieldFields.join(' ') + '}'
      : ''
    }
                  ${couponsFields.length > 0
                    ? 'coupons {' + couponsFields.join(' ') + '}'
                    : ''
                  }
                  ${offersFields.length > 0
                    ? 'offers {' + offersFields.join(' ') + '}'
                    : ''
                  }
                  ${rootFields.join(' ')}
                  amortizations { date }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }`;
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
