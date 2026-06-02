import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  LOCALE_ID,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {
  Descriptor,
  DescriptorsGroup
} from "../../types/instrument-descriptors.types";
import {
  Derivative,
  Query
} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.types";
import {
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {InstrumentInfoBase} from '../instrument-info-base/instrument-info-base';
import {
  CurrencyPipe,
  formatNumber
} from "@angular/common";
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {REFRESH_TIMEOUT_MS} from "../../constants/instrument-info.constants";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DescriptorFiller} from "../../utils/descriptor-filler";
import {InstrumentHelper} from '@terminal-core-lib/features/instruments/utils/instrument-helper';
import {InstrumentType} from '@terminal-core-lib/common/types/instrument.types';
import {
  Modify,
  ZodPropertiesOf
} from '@terminal-core-lib/features/graphql/utils/zod-types.helper';
import {
  object,
  ZodObject
} from 'zod/v3';
import {DerivativeSchema} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {DescriptorsList} from '@terminal-widgets-lib/widgets/instrument-info/components/descriptors-list/descriptors-list';
import {SectionsList} from '@terminal-widgets-lib/widgets/instrument-info/components/sections-list/sections-list';
import {Section} from '@terminal-widgets-lib/widgets/instrument-info/components/section/section';

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
    TranslocoDirective,
    LetDirective,
    NzEmptyComponent,
    NzTabsComponent,
    NzTabComponent,
    DescriptorsList,
    SectionsList,
    Section
  ],
  templateUrl: './derivative-info.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DerivativeInfo extends InstrumentInfoBase implements OnInit {
  info$!: Observable<Derivative | null>;

  descriptors$!: Observable<DescriptorsGroup[] | null>;

  private readonly graphQlService = inject(GraphQlService);

  private readonly translatorService = inject(TranslatorService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly locale = inject(LOCALE_ID);

  private readonly destroyRef = inject(DestroyRef);

  private readonly currencyPipe = new CurrencyPipe(this.locale);

  ngOnInit(): void {
    this.initDataStream();
    this.initDescriptors();
  }

  private initDataStream(): void {
    this.info$ = this.instrumentKeyChanges$.pipe(
      filter(i => i != null),
      withRefresh(3 * REFRESH_TIMEOUT_MS, this.applicationStatusService.isActive$),
      tap(() => this.setLoading(true)),
      switchMap(i => {
        return this.graphQlService.queryForSchema<DerivativeResponse>(
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
      takeUntilDestroyed(this.destroyRef),
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

  private getBasicInformationDescriptors(derivative: Derivative): Descriptor[] {
    const descriptors: Descriptor[] = [
      ...DescriptorFiller.basicInformation({
        basicInformation: derivative.basicInformation,
        boardInformation: derivative.boardInformation,
        financialAttributes: derivative.financialAttributes,
        currencyInformation: derivative.currencyInformation
      }),
      {
        id: "expirationDate",
        formattedValue: new Date(derivative.additionalInformation.cancellation).toLocaleDateString()
      }
    ];

    const instrumentType = InstrumentHelper.getTypeByCfi(derivative.financialAttributes.cfiCode);
    if (instrumentType === InstrumentType.Futures) {
      const futureType = InstrumentHelper.getFutureType(derivative.financialAttributes.cfiCode);
      if (futureType != null) {
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

    if (derivative.theorPrice != null && derivative.theorPrice !== 0) {
      descriptors.push({
        id: 'theorPrice',
        formattedValue: this.formatCurrency(derivative.theorPrice, currencyCode, '0.0-6')
      });
    }

    if (derivative.theorPriceLimit != null && derivative.theorPriceLimit !== 0) {
      descriptors.push({
        id: 'theorPriceLimit',
        formattedValue: this.formatCurrency(derivative.theorPriceLimit, currencyCode, '0.0-6')
      });
    }

    if (derivative.marginBuy != null && derivative.marginBuy !== 0) {
      descriptors.push({
        id: 'marginBuy',
        formattedValue: formatNumber(derivative.marginBuy, this.locale, '0.1-2')
      });
    }

    if (derivative.marginSell != null && derivative.marginSell !== 0) {
      descriptors.push({
        id: 'marginSell',
        formattedValue: formatNumber(derivative.marginSell, this.locale, '0.1-2')
      });
    }

    if (derivative.volatility != null && derivative.volatility !== 0) {
      descriptors.push({
        id: 'volatility',
        formattedValue: formatNumber(derivative.volatility, this.locale, '0.1-2')
      });
    }

    return descriptors;
  }

  private getCurrencyDescriptors(derivative: Derivative): Descriptor[] {
    return DescriptorFiller.currencyInformation(derivative.currencyInformation);
  }

  private getTradingParametersDescriptors(derivative: Derivative): Descriptor[] {
    return DescriptorFiller.tradingParameters({
      tradingDetails: derivative.tradingDetails,
      currencyInformation: derivative.currencyInformation,
      locale: this.locale
    });
  }

  private getTradingDataDescriptors(derivative: Derivative): Descriptor[] {
    return DescriptorFiller.tradingData({
      tradingDetails: derivative.tradingDetails,
      locale: this.locale
    });
  }

  private getAdditionalInfoDescriptors(derivative: Derivative): Descriptor[] {
    return DescriptorFiller.additionalInformation({
      additionalInfo: derivative.additionalInformation,
      locale: this.locale
    });
  }

  private formatCurrency(value: number, currencyCode: string, digitsInfo = '0.1-2'): string {
    return this.currencyPipe.transform(value, currencyCode, 'symbol-narrow', digitsInfo, this.locale) ?? '';
  }
}
