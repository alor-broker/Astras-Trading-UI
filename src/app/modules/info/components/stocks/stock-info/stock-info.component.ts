import {
  Component,
  OnInit
} from '@angular/core';
import {
  FetchPolicy,
  GraphQlService
} from "../../../../../shared/services/graph-ql.service";
import { TranslatorService } from "../../../../../shared/services/translator.service";
import {
  combineLatest,
  Observable,
  shareReplay,
  switchMap,
  tap
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
} from "zod";
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
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import { DescriptorFiller } from "../../../utils/descriptor-filler";
import { RisksComponent } from "../../common/risks/risks.component";
import { FinanceComponent } from "../finance/finance.component";
import { DividendsComponent } from "../dividends/dividends.component";

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
  standalone: true,
  imports: [
    NzTabSetComponent,
    TranslocoDirective,
    NzTabComponent,
    LetDirective,
    NzEmptyComponent,
    DescriptorsListComponent,
    RisksComponent,
    FinanceComponent,
    DividendsComponent
  ],
  templateUrl: './stock-info.component.html',
  styleUrl: './stock-info.component.less'
})
export class StockInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  info$!: Observable<Stock | null>;

  commonDescriptors$!: Observable<DescriptorsGroup[] | null>;

  constructor(
    private readonly graphQlService: GraphQlService,
    private readonly translatorService: TranslatorService) {
    super();
  }

  ngOnInit(): void {
    this.initDataStream();
    this.initDescriptors();
  }

  private initDataStream(): void {
    this.info$ = this.targetInstrumentKey$.pipe(
      filter(i => i != null),
      tap(() => this.setLoading(true)),
      switchMap(i => {
        return this.graphQlService.watchQueryForSchema<StockResponse>(
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
    this.commonDescriptors$ = combineLatest({
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
            title: x.translator(['groupTitles', 'tradingDetails']),
            items: this.getTradingDetailsDescriptors(x.info)
          }
        ];
      })
    );
  }

  private getBasicInformationDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.basicInformation({
      basicInformation: stock.basicInformation,
      financialAttributes: stock.financialAttributes,
      currencyInformation: stock.currencyInformation
    });
  }

  private getTradingDetailsDescriptors(stock: Stock): Descriptor[] {
    return DescriptorFiller.tradingDetails({
      tradingDetails: stock.tradingDetails,
      currencyInformation: stock.currencyInformation
    });
  }
}
