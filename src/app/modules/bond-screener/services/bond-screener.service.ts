import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { BondScreenerResponse } from "../models/bond-screener.model";
import { GraphQlService } from "../../../shared/services/graph-ql.service";
import { BOND_NESTED_FIELDS } from "../utils/bond-screener.helper";

@Injectable({
  providedIn: 'root'
})
export class BondScreenerService {

  constructor(
    private readonly graphQlService: GraphQlService
  ) {
  }

  getBonds(columnIds: string[], sort: string | null, variables: { [propName: string]: any } = {}): Observable<BondScreenerResponse | null> {
    return this.graphQlService.watchQuery(this.getBondsQuery(columnIds, sort), variables);
  }

  getBondsQuery(columnIds: string[], sort: string | null): string {
    const basicInformationFields = BOND_NESTED_FIELDS.basicInformation.filter(f => columnIds.includes(f) || f === 'symbol' || f === 'exchange');
    const additionalInformationFields = BOND_NESTED_FIELDS.additionalInformation.filter(f => columnIds.includes(f));
    const financialAttributesFields = BOND_NESTED_FIELDS.financialAttributes.filter(f => columnIds.includes(f));
    const boardInformationFields = BOND_NESTED_FIELDS.boardInformation.filter(f => columnIds.includes(f));
    const tradingDetailsFields = BOND_NESTED_FIELDS.tradingDetails.filter(f => columnIds.includes(f));
    const yieldFields = BOND_NESTED_FIELDS.yield.filter(f => columnIds.includes(f));
    const rootFields = BOND_NESTED_FIELDS.rootFields.filter(f => columnIds.includes(f));

    return `query GET_BONDS($first: Int, $after: String, $filters: BondFilterInput) {
            bonds(
              first: $first,
              after: $after,
              where: $filters,
              ${ sort == null ? '' : ('order: ' + sort) }
              ) {
              edges {
                node {
                  basicInformation { ${ basicInformationFields.join(' ') } }
                  ${ additionalInformationFields.length > 0
                    ? 'additionalInformation {' + additionalInformationFields.join(' ') + '}'
                    : ''
                  }
                  ${ financialAttributesFields.length > 0
                    ? 'financialAttributes {' + financialAttributesFields.join(' ') + '}'
                    : ''
                  }
                  ${ boardInformationFields.length > 0
                    ? 'boardInformation {' + boardInformationFields.join(' ') + '}'
                    : ''
                  }
                  ${ tradingDetailsFields.length > 0
                    ? 'tradingDetails {' + tradingDetailsFields.join(' ') + '}'
                    : ''
                  }
                  ${ yieldFields.length > 0
                    ? 'yield {' + yieldFields.join(' ') + '}'
                    : ''
                  }
                  ${ rootFields.join(' ') }
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
}
