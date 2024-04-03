import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { AllInstrumentsResponse } from "../model/all-instruments.model";
import { FetchPolicy, GraphQlService } from "../../../shared/services/graph-ql.service";
import { DefaultTableFilters } from "../../../shared/models/settings/table-settings.model";
import { GraphQlHelper } from "../../../shared/utils/graph-ql-helper";
import { GraphQlSort } from "../../../shared/models/graph-ql.model";

const ALL_INSTRUMENTS_NESTED_FIELDS: { [fieldName: string]: string[] } = {
  basicInformation: ['symbol', 'shortName', 'exchange', 'market'],
  financialAttributes: ['tradingStatusInfo'],
  additionalInformation: ['cancellation', 'priceMultiplier'],
  boardInformation: ['board'],
  tradingDetails: ['lotSize', 'minStep', 'priceMax', 'priceMin', 'priceStep', 'rating'],
  currencyInformation: ['nominal'],
  realTimeData: ['dailyGrowth', 'dailyGrowthPercent', 'price', 'tradeVolume', 'yield']
};

const ALL_INSTRUMENTS_FILTER_TYPES: { [fieldName: string]: string[] } = {
  search: ['symbol', 'shortName', 'nominal'],
  multiSelect: ['exchange', 'market', 'board'],
  interval: [
    'priceMultiplierFrom',
    'priceMultiplierTo',
    'lotSizeFrom',
    'lotSizeTo',
    'minStepFrom',
    'minStepTo',
    'priceMaxFrom',
    'priceMaxTo',
    'priceMinFrom',
    'priceMinTo',
    'priceStepFrom',
    'priceStepTo',
    'dailyGrowthFrom',
    'dailyGrowthTo',
    'dailyGrowthPercentFrom',
    'dailyGrowthPercentTo',
    'tradeVolumeFrom',
    'tradeVolumeTo',
    'priceFrom',
    'priceTo',
    'yieldFrom',
    'yieldTo'
  ],
  date: [
    'cancellationTo',
    'cancellationFrom',
  ]
};

@Injectable({
  providedIn: 'root'
})
export class AllInstrumentsService {

  constructor(
    private readonly graphQlService: GraphQlService
  ) {}

  getInstruments(
    columnIds: string[],
    filters: DefaultTableFilters,
    params: { first: number, after?: string, sort: GraphQlSort | null }
  ): Observable<AllInstrumentsResponse | null> {
    return this.graphQlService.watchQuery(
      this.getAllInstrumentsRequestQuery(columnIds),
      {
        ...params,
        filters: GraphQlHelper.parseFilters(filters, ALL_INSTRUMENTS_NESTED_FIELDS, ALL_INSTRUMENTS_FILTER_TYPES)
      },
      { fetchPolicy: FetchPolicy.NoCache }
    );
  }

  private getAllInstrumentsRequestQuery(columnIds: string[]): string {
    const basicInformationFields = ALL_INSTRUMENTS_NESTED_FIELDS.basicInformation.filter(f => columnIds.includes(f) || f === 'symbol' || f === 'exchange');
    const additionalInformationFields = ALL_INSTRUMENTS_NESTED_FIELDS.additionalInformation.filter(f => columnIds.includes(f));
    const financialAttributesFields = ALL_INSTRUMENTS_NESTED_FIELDS.financialAttributes.filter(f => columnIds.includes(f));
    const boardInformationFields = ALL_INSTRUMENTS_NESTED_FIELDS.boardInformation.filter(f => columnIds.includes(f));
    const tradingDetailsFields = ALL_INSTRUMENTS_NESTED_FIELDS.tradingDetails.filter(f => columnIds.includes(f));
    const currencyInformationFields = ALL_INSTRUMENTS_NESTED_FIELDS.currencyInformation.filter(f => columnIds.includes(f));
    const realTimeDataFields = ALL_INSTRUMENTS_NESTED_FIELDS.realTimeData.filter(f => columnIds.includes(f));

    return `
      query GET_INSTRUMENTS($first: Int, $after: String, $filters: InstrumentModelFilterInput, $sort: [InstrumentModelSortInput!]) {
        instruments(
          first: $first
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
              ${currencyInformationFields.length > 0
                ? 'currencyInformation {' + currencyInformationFields.join(' ') + '}'
                : ''
              }
              ${realTimeDataFields.length > 0
                ? 'realTimeData {' + realTimeDataFields.join(' ') + '}'
                : ''
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }
}
