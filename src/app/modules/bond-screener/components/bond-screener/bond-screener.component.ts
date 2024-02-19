import { Component, Input, OnInit } from '@angular/core';
import { Apollo, gql } from "apollo-angular";
import { BehaviorSubject, Observable, of, shareReplay } from 'rxjs';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { BaseColumnSettings } from '../../../../shared/models/settings/table-settings.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { BondScreenerSettings } from '../../models/bond-screener-settings.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ats-bond-screener',
  templateUrl: './bond-screener.component.html',
  styleUrls: ['./bond-screener.component.less']
})
export class BondScreenerComponent implements OnInit {

  @Input({required: true}) guid!: string;

  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  isLoading$ = new BehaviorSubject<boolean>(false);
  tableConfig$!: Observable<TableConfig<any>>;
  bondsDisplay$!: Observable<any[]>;
  settings$!:Observable<BondScreenerSettings>;
  allColumns: BaseColumnSettings<any>[] = [
    {
      id: 'status',
      displayName: 'Статус',
      width: 100,
      sortChangeFn: (): string => '',
      filterData: {
        filterName: 'status',
        isDefaultFilter: true,
        filters: [
        ],
        isMultipleFilter: true
      }
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      width: 100,
      sortChangeFn: (): string => '',
      filterData: {
        filterName: 'symbol'
      }
    },
    {
      id: 'name',
      displayName: 'Наименование',
      width: 100,
      sortChangeFn: (): string => '',
      filterData: {
        filterName: 'name'
      }
    },
  ];

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly apollo: Apollo
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BondScreenerSettings>(this.guid)
      .pipe(shareReplay(1));

    this.tableConfig$ = this.settings$.pipe(
      map(() => {

        return {
          columns: this.allColumns
        };
      })
    );

    this.bondsDisplay$ = of([]);


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

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  applyFilter(e: any): any {
    return e;
  }

  selectInstrument(e: any): any {
    return e;
  }

  scrolled(): null {
    return null;
  }

  changeColumnOrder(e: any): any {
    return e;
  }
}
