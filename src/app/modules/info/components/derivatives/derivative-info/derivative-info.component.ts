import {
  Component,
  Inject,
  LOCALE_ID,
  OnInit
} from '@angular/core';
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzTabComponent,
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import { TranslocoDirective } from "@jsverse/transloco";
import { InstrumentInfoBaseComponent } from "../../instrument-info-base/instrument-info-base.component";
import {
  combineLatest,
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {
  Derivative,
  Query
} from "../../../../../../generated/graphql.types";
import {
  Descriptor,
  DescriptorsGroup
} from "../../../models/instrument-descriptors.model";
import {
  FetchPolicy,
  GraphQlService
} from "../../../../../shared/services/graph-ql.service";
import { TranslatorService } from "../../../../../shared/services/translator.service";
import {
  filter,
  map
} from "rxjs/operators";
import { DescriptorFiller } from "../../../utils/descriptor-filler";
import {
  Modify,
  ZodPropertiesOf
} from "../../../../../shared/utils/graph-ql/zod-helper";
import {
  object,
  ZodObject
} from "zod";
import { DerivativeSchema, } from "../../../../../../generated/graphql.schemas";
import {
  getFutureType,
  getTypeByCfi
} from "../../../../../shared/utils/instruments";
import { InstrumentType } from "../../../../../shared/models/enums/instrument-type.model";
import {
  CurrencyPipe,
  formatNumber
} from "@angular/common";

type DerivativeResponse = Modify<
  Query,
  'derivative',
  {
    derivative: Derivative | null;
  }
>;

const ResponseSchema: ZodObject<ZodPropertiesOf<DerivativeResponse>> = object({
  derivative: DerivativeSchema()
});

@Component({
    selector: 'ats-derivative-info',
    imports: [
        DescriptorsListComponent,
        LetDirective,
        NzEmptyComponent,
        NzTabComponent,
        NzTabSetComponent,
        TranslocoDirective
    ],
    templateUrl: './derivative-info.component.html',
    styleUrl: './derivative-info.component.less'
})
export class DerivativeInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  info$!: Observable<Derivative | null>;

  commonDescriptors$!: Observable<DescriptorsGroup[] | null>;

  private readonly currencyPipe = new CurrencyPipe(this.locale);

  constructor(
    private readonly graphQlService: GraphQlService,
    private readonly translatorService: TranslatorService,
    @Inject(LOCALE_ID) private readonly locale: string) {
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
        return this.graphQlService.watchQueryForSchema<DerivativeResponse>(
          ResponseSchema,
          {
            symbol: {value: i.symbol, required: true},
            exchange: {value: i.exchange, required: true},
            board: {value: i.board, required: true},
          },
          {fetchPolicy: FetchPolicy.NoCache}
        ).pipe(
          map(r => r?.derivative ?? null)
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

  private getBasicInformationDescriptors(derivative: Derivative): Descriptor[] {
    const descriptors: Descriptor[] = [
      ...DescriptorFiller.basicInformation({
        basicInformation: derivative.basicInformation,
        financialAttributes: derivative.financialAttributes,
        currencyInformation: derivative.currencyInformation
      }),
      {
        id: "expirationDate",
        formattedValue: new Date(derivative.additionalInformation.cancellation).toLocaleDateString()
      }
    ];

    const instrumentType = getTypeByCfi(derivative.financialAttributes.cfiCode);
    if(instrumentType === InstrumentType.Futures) {
      const futureType = getFutureType(derivative.financialAttributes.cfiCode);
      if(futureType != null) {
        descriptors.push({
          id: 'futureType',
          valueTranslationKey: 'futureTypeOptions.' + futureType,
          formattedValue: futureType
        });
      }
    }

    const currencyCode = derivative.underlyingCurrency
      ?? derivative.currencyInformation.settlement
      ?? derivative.currencyInformation.nominal
      ?? 'RUB';

    if(derivative.theorPrice != null && derivative.theorPrice !== 0) {
      descriptors.push({
        id: 'theorPrice',
        formattedValue: this.formatCurrency(derivative.theorPrice, currencyCode, '0.0-6')
      });
    }

    if(derivative.theorPriceLimit != null && derivative.theorPriceLimit !== 0) {
      descriptors.push({
        id: 'theorPriceLimit',
        formattedValue: this.formatCurrency(derivative.theorPriceLimit, currencyCode, '0.0-6')
      });
    }

    if(derivative.marginBuy != null && derivative.marginBuy !== 0) {
      descriptors.push({
        id: 'marginBuy',
        formattedValue: formatNumber(derivative.marginBuy, this.locale, '0.1-2')
      });
    }

    if(derivative.marginSell != null && derivative.marginSell !== 0) {
      descriptors.push({
        id: 'marginSell',
        formattedValue: formatNumber(derivative.marginSell, this.locale, '0.1-2')
      });
    }

    if(derivative.volatility != null && derivative.volatility !== 0) {
      descriptors.push({
        id: 'volatility',
        formattedValue: formatNumber(derivative.volatility, this.locale, '0.1-2')
      });
    }

    return descriptors;
  }

  private getTradingDetailsDescriptors(derivative: Derivative): Descriptor[] {
    return DescriptorFiller.tradingDetails({
      tradingDetails: derivative.tradingDetails,
      currencyInformation: derivative.currencyInformation
    });
  }

  private formatCurrency(value: number, currencyCode: string, digitsInfo = '0.1-2'): string {
    return this.currencyPipe.transform(value, currencyCode, 'symbol-narrow', digitsInfo, this.locale) ?? '';
  }
}
