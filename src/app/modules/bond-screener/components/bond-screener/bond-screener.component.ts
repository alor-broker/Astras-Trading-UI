import { Component, Input, OnInit } from '@angular/core';
import { Apollo, gql } from "apollo-angular";

@Component({
  selector: 'ats-bond-screener',
  templateUrl: './bond-screener.component.html',
  styleUrls: ['./bond-screener.component.less']
})
export class BondScreenerComponent implements OnInit {

  @Input({required: true}) guid!: string;

  constructor(
    private readonly apollo: Apollo
  ) {
  }

  ngOnInit(): void {
    const gqlReq = gql<any, { first: number }>`
        {
        instruments(
          first: $first
          where: {
              basicInformation: {
                  symbol: {
                      eq: "MTLR"
                  }
              }
              boardInformation: {
                  board: {
                      and: [
                          {
                              contains: "E"
                          },
                          {
                              contains: "Q"
                          }
                      ]
                  }
              }
          }
          ) {
          edges {
            node {
              basicInformation {
                symbol
                shortName
              }
              currencyInformation {
                  nominal
              }
              boardInformation {
                  board
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`;

    this.apollo.watchQuery({
      query: gqlReq,
      variables: { "first": 5 }
    })
      .valueChanges.subscribe(v => console.log(v));
  }
}
