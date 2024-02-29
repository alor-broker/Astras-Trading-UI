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
import { BOND_NESTED_FIELDS } from "../utils/bond-screener.helper";
import {
  BondYield,
  BondYieldsResponse
} from "../models/bond-yield-curve.model";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class BondScreenerService {

  constructor(
    private readonly graphQlService: GraphQlService
  ) {
  }

  getBonds(columnIds: string[], sort: string | null, variables: {
    [propName: string]: any;
  } = {}): Observable<BondScreenerResponse | null> {
    return this.graphQlService.watchQuery(this.getBondsQuery(columnIds, sort), variables);
  }

  getBondsYieldCurve(): Observable<BondYield[] | null> {
    // now only ОФЗ bonds are supported
    const now = new Date();
    now.setMinutes(0, 0, 0);

    const query = `
          query Bonds($now: DateTime!) {
          bonds(
              first: 1000
              where: {
                  basicInformation: { shortName: { startsWith: "ОФЗ" } }
                  boardInformation: { isPrimaryBoard: { eq: true } }
                  maturityDate: { gte: $now }
                  duration: { neq: null }
                  durationMacaulay: { neq: null }
                  yield: {
                    and: {
                      currentYield: { neq: null },
                      yieldToMaturity: { neq: null }
                    }
                  }
              }
               order: { maturityDate: DESC }
          ) {
              nodes {
                  basicInformation {
                      symbol
                      exchange
                      shortName
                  }
                  maturityDate
                  duration
                  durationMacaulay
                  yield {
                      currentYield
                      yieldToMaturity
                  }
              }
          }
      }
    `;

    return this.graphQlService.watchQuery<BondYieldsResponse>(query, { now: now.toISOString() }, { fetchPolicy: FetchPolicy.NoCache }).pipe(
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

  private getBondsQuery(columnIds: string[], sort: string | null): string {
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
              ${sort == null ? '' : ('order: ' + sort)}
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
                  ${yieldFields.length > 0
      ? 'yield {' + yieldFields.join(' ') + '}'
      : ''
    }
                  ${rootFields.join(' ')}
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
