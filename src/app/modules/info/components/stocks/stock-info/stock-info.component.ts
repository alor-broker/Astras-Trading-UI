import { Component, DestroyRef, LOCALE_ID, OnInit, inject } from '@angular/core';
import {
  FetchPolicy,
  GraphQlService
} from "../../../../../shared/services/graph-ql.service";
import { TranslatorService } from "../../../../../shared/services/translator.service";
import {
  combineLatest,
  defer,
  Observable,
  shareReplay,
  switchMap,
  tap,
  timer
} from "rxjs";
import {
  Query,
  Stock
} from "../../../../../../generated/graphql.types";
import { InstrumentInfoBaseComponent } from "../../instrument-info-base/instrument-info-base.component";
import {
  Modify,
  ZodPropertiesOf
} from "../../../../../shared/utils/graph-ql/zod-helper";
import {
  object,
  ZodObject
} from "zod/v3";
import { StockSchema } from "../../../../../../generated/graphql.schemas";
import {
  filter,
  map
} from "rxjs/operators";
import {
  Descriptor,
  DescriptorsGroup
} from "../../../models/instrument-descriptors.model";
import {
  NzTabComponent,
  NzTabsComponent
} from "ng-zorro-antd/tabs";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import { DescriptorFiller } from "../../../utils/descriptor-filler";
import { RisksComponent } from "../../common/risks/risks.component";
import { FinanceComponent } from "../finance/finance.component";
import { DividendsComponent } from "../dividends/dividends.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { REFRESH_TIMEOUT_MS } from "../../../constants/info.constants";
import { DividendsChartComponent } from "../dividends-chart/dividends-chart.component";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";
import { SectionsListComponent } from "../../sections-list/sections-list.component";
import { SectionComponent } from "../../section/section.component";

type StockResponse = Modify<
  Query,
  'stock',
  {
    stock: Stock | null;
  }
>;

const ResponseSchema: ZodObject<ZodPropertiesOf<StockResponse>> = object({
  stock: StockSchema()
});

@Component({
    selector: 'ats-stock-info',
  imports: [
    TranslocoDirective,
    NzTabComponent,
    LetDirective,
    NzEmptyComponent,
    DescriptorsListComponent,
    RisksComponent,
    FinanceComponent,
    DividendsComponent,
    DividendsChartComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzTabsComponent,
    SectionsListComponent,
    SectionComponent
  ],
    templateUrl: './stock-info.component.html',
    styleUrl: './stock-info.component.less'
})
export class StockInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  private readonly graphQlService = inject(GraphQlService);
  private readonly translatorService = inject(TranslatorService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  info$!: Observable<Stock | null>;

  descriptors$!: Observable<DescriptorsGroup[] | null>;

  ngOnInit(): void {
    this.initDataStream();
    this.initDescriptors();
  }

  private initDataStream(): void {
    const refreshTimer$ = defer(() => {
      return timer(0, REFRESH_TIMEOUT_MS).pipe(
        takeUntilDestroyed(this.destroyRef)
      );
    });

    this.info$ = this.instrumentKeyChanges$.pipe(
      filter(i => i != null),
      mapWith(() => refreshTimer$, (source,) => source),
      tap(() => this.setLoading(true)),
      switchMap(i => {
        return this.graphQlService.queryForSchema<StockResponse>(
          ResponseSchema,
          {
            symbol: {value: i.symbol, required: true},
            exchange: {value: i.exchange, required: true},
            board: {value: i.board, required: true},
          },
          {fetchPolicy: FetchPolicy.NoCache}
        ).pipe(
          map(r => r?.stock ?? null)
        );
      }),
      tap(() => this.setLoading(false)),
      shareReplay(1)
    );
  }

  private initDescriptors(): void {
    this.descriptors$ = combineLatest({
      info: this.info$,
      translator: this.translatorService.getTranslator('info/descriptors-list')
    }).pipe(
      map(x => {
        if (x.info == null) {
          return null;
        }

        return [
          {
            title: null,
            items: this.getBasicInformationDescriptors(x.info)
          },
          {
            title: x.translator(['groupTitles', 'currency']),
            items: this.getCurrencyDescriptors(x.info)
          },
          {
            title: x.translator(['groupTitles', 'tradingParameters']),
            items: this.getTradingParametersDescriptors(x.info)
          },
          {
            title: x.translator(['groupTitles', 'tradingData']),
            items: this.getTradingDataDescriptors(x.info)
          },
          {
            title: x.translator(['groupTitles', 'additional']),
            items: this.getAdditionalInfoDescriptors(x.info)
          }
        ];
      })
    );
  }

  private getBasicInformationDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.basicInformation({
      basicInformation: stock.basicInformation,
      boardInformation: stock.boardInformation,
      financialAttributes: stock.financialAttributes,
      currencyInformation: stock.currencyInformation
    });
  }

  private getCurrencyDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.currencyInformation(stock.currencyInformation);
  }

  private getTradingParametersDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.tradingParameters({
      tradingDetails: stock.tradingDetails,
      currencyInformation: stock.currencyInformation,
      locale: this.locale
    });
  }

  private getTradingDataDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.tradingData({
      tradingDetails: stock.tradingDetails,
      locale: this.locale
    });
  }

  private getAdditionalInfoDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.additionalInformation({
      additionalInfo: stock.additionalInformation,
      locale: this.locale
    });
  }
}
