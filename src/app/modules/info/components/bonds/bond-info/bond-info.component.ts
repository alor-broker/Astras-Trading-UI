import {
  Component,
  DestroyRef,
  Inject,
  LOCALE_ID,
  OnInit
} from '@angular/core';
import { InstrumentInfoBaseComponent } from "../../instrument-info-base/instrument-info-base.component";
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
  Bond,
  Query,
} from "../../../../../../generated/graphql.types";
import {
  Descriptor,
  DescriptorsGroup
} from "../../../models/instrument-descriptors.model";
import {
  FetchPolicy,
  GraphQlService
} from "../../../../../shared/services/graph-ql.service";
import {
  TranslatorFn,
  TranslatorService
} from "../../../../../shared/services/translator.service";
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
import { BondSchema } from "../../../../../../generated/graphql.schemas";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzTabComponent,
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import { RisksComponent } from "../../common/risks/risks.component";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import {
  CurrencyPipe,
  formatNumber,
  formatPercent
} from "@angular/common";
import { CalendarComponent } from "../calendar/calendar.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { REFRESH_TIMEOUT_MS } from "../../../constants/info.constants";

type BondResponse = Modify<
  Query,
  'bond',
  {
    bond: Bond | null;
  }
>;

const ResponseSchema: ZodObject<ZodPropertiesOf<BondResponse>> = object({
  bond: BondSchema()
});

interface BondDescriptors {
  common: DescriptorsGroup[];
  aboutIssue: DescriptorsGroup[];
}

@Component({
  selector: 'ats-bond-info',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzEmptyComponent,
    NzTabSetComponent,
    NzTabComponent,
    RisksComponent,
    DescriptorsListComponent,
    CalendarComponent
  ],
  templateUrl: './bond-info.component.html',
  styleUrl: './bond-info.component.less'
})
export class BondInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  info$!: Observable<Bond | null>;

  descriptors$!: Observable<BondDescriptors | null>;

  private readonly currencyPipe = new CurrencyPipe(this.locale);

  constructor(
    private readonly graphQlService: GraphQlService,
    private readonly translatorService: TranslatorService,
    @Inject(LOCALE_ID) private readonly locale: string,
    private readonly destroyRef: DestroyRef) {
    super();
  }

  ngOnInit(): void {
    this.initDataStream();
    this.initDescriptors();
  }

  private initDataStream(): void {
    const refreshTimer$ = defer(() => {
      return timer(0, 3 * REFRESH_TIMEOUT_MS).pipe(
        takeUntilDestroyed(this.destroyRef)
      );
    });

    this.info$ = this.targetInstrumentKey$.pipe(
      filter(i => i != null),
      mapWith(() => refreshTimer$, (source,) => source),
      tap(() => this.setLoading(true)),
      switchMap(i => {
        return this.graphQlService.watchQueryForSchema<BondResponse>(
          ResponseSchema,
          {
            symbol: {value: i.symbol, required: true},
            exchange: {value: i.exchange, required: true},
            board: {value: i.board, required: true},
          },
          {fetchPolicy: FetchPolicy.NoCache}
        ).pipe(
          map(r => r?.bond ?? null)
        );
      }),
      tap(() => this.setLoading(false)),
      shareReplay(1)
    );
  }

  private initDescriptors(): void {
    this.descriptors$ = combineLatest({
      info: this.info$,
      translator: this.translatorService.getTranslator('info/descriptors-list'),
      commonTranslator: this.translatorService.getTranslator(''),
    }).pipe(
      map(x => {
        if (x.info == null) {
          return null;
        }

        return {
          common: this.getCommonDescriptors(x.info, x.translator),
          aboutIssue: this.getAboutIssueDescriptors(x.info, x.translator, x.commonTranslator)
        };
      })
    );
  }

  private getCommonDescriptors(bond: Bond, translator: TranslatorFn): DescriptorsGroup[] {
    return [
      {
        title: null,
        items: this.getBasicInformationDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'currency']),
        items: this.getCurrencyDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'tradingParameters']),
        items: this.getTradingParametersDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'tradingData']),
        items: this.getTradingDataDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'additional']),
        items: this.getAdditionalInfoDescriptors(bond)
      }
    ];
  }

  private getAboutIssueDescriptors(bond: Bond, translator: TranslatorFn, commonTranslator: TranslatorFn): DescriptorsGroup[] {
    const currencyCode = bond.currencyInformation.nominal ?? bond.currencyInformation.settlement ?? 'RUB';

    return [
      {
        title: null,
        items: this.getIssueBaseDescriptors(bond, currencyCode, commonTranslator)
      },
      {
        title: translator(['groupTitles', 'currency']),
        items: this.getCurrencyDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'volumes']),
        items: this.getVolumesDescriptors(bond, currencyCode)
      },
      {
        title: translator(['groupTitles', 'yield']),
        items: this.getYieldDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'duration']),
        items: this.getDurationDescriptors(bond)
      },
      {
        title: translator(['groupTitles', 'nearestAmortization']),
        items: this.getNearestAmortizationDescriptors(bond, currencyCode)
      },
      {
        title: translator(['groupTitles', 'nearestCoupon']),
        items: this.getNearestCouponDescriptors(bond, currencyCode)
      }
    ];
  }

  private getIssueBaseDescriptors(bond: Bond, currencyCode: string, commonTranslator: TranslatorFn): Descriptor[] {
    const descriptors: Descriptor[] = [
      {
        id: 'faceValue',
        formattedValue: this.formatCurrency(bond.faceValue, currencyCode)
      },
      {
        id: 'currentFaceValue',
        formattedValue: this.formatCurrency(bond.currentFaceValue, currencyCode)
      }
    ];

    if (bond.placementEndDate != null) {
      descriptors.push({
        id: 'issueDate',
        formattedValue: new Date(bond.placementEndDate).toLocaleDateString()
      });
    }

    if (bond.maturityDate != null) {
      descriptors.push({
        id: 'maturityDate',
        formattedValue: new Date(bond.maturityDate).toLocaleDateString()
      });
    }

    if (bond.couponRate != null) {
      descriptors.push({
        id: 'couponRate',
        formattedValue: formatPercent(bond.couponRate / 100, this.locale, '0.1-2')
      });
    }

    descriptors.push({
      id: 'guaranteed',
      formattedValue: bond.guaranteed ? commonTranslator(['yes']) : commonTranslator(['no'])
    });

    return descriptors;
  }

  private getVolumesDescriptors(bond: Bond, currencyCode: string): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if (bond.volumes != null) {
      descriptors.push({
        id: 'issueVolume',
        formattedValue: formatNumber(bond.volumes.issueVolume, this.locale)
      });

      descriptors.push({
        id: 'issueValue',
        formattedValue: this.formatCurrency(bond.volumes.issueValue, currencyCode)
      });

      descriptors.push({
        id: 'marketVolume',
        formattedValue: formatNumber(bond.volumes.marketVolume, this.locale)
      });

      descriptors.push({
        id: 'marketValue',
        formattedValue: this.formatCurrency(bond.volumes.marketValue, currencyCode)
      });
    }

    return descriptors;
  }

  private getYieldDescriptors(bond: Bond): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if (bond.yield != null) {
      descriptors.push({
        id: 'currentYield',
        formattedValue: formatPercent(bond.yield.currentYield / 100, this.locale, '0.1-2')
      });

      descriptors.push({
        id: 'yieldToMaturity',
        formattedValue: formatPercent(bond.yield.yieldToMaturity, this.locale, '0.1-2')
      });
    }

    return descriptors;
  }

  private getDurationDescriptors(bond: Bond): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if (bond.duration != null) {
      descriptors.push({
        id: 'duration',
        formattedValue: formatPercent(bond.duration / 100, this.locale, '0.1-2')
      });
    }

    if (bond.durationMacaulay != null) {
      descriptors.push({
        id: 'durationMacaulay',
        formattedValue: formatNumber(bond.durationMacaulay, this.locale)
      });
    }

    return descriptors;
  }

  private getBasicInformationDescriptors(bond: Bond): Descriptor[] {
    return DescriptorFiller.basicInformation({
      basicInformation: bond.basicInformation,
      boardInformation: bond.boardInformation,
      financialAttributes: bond.financialAttributes,
      currencyInformation: bond.currencyInformation
    });
  }

  private getCurrencyDescriptors(bond: Bond): Descriptor[] {
    return DescriptorFiller.currencyInformation(bond.currencyInformation);
  }

  private getNearestAmortizationDescriptors(bond: Bond, currencyCode: string): Descriptor[] {
    const descriptors: Descriptor[] = [];

    const nearestAmortization = (bond.amortizations ?? []).find(a => a.isClosest);
    if (nearestAmortization != null) {
      descriptors.push({
        id: 'nearestAmortizationParFraction',
        formattedValue: formatPercent(nearestAmortization.parFraction, this.locale)
      });

      descriptors.push({
        id: 'nearestAmortizationAmount',
        formattedValue: this.formatCurrency(nearestAmortization.amount, nearestAmortization.currency ?? currencyCode)
      });

      descriptors.push({
        id: 'nearestAmortizationDate',
        translationKey: 'date',
        formattedValue: new Date(nearestAmortization.date).toLocaleDateString()
      });
    }

    return descriptors;
  }

  private getNearestCouponDescriptors(bond: Bond, currencyCode: string): Descriptor[] {
    const descriptors: Descriptor[] = [];

    const nearestCoupon = (bond.coupons ?? []).find(a => a.isClosest);
    if (nearestCoupon != null) {
      descriptors.push({
        id: 'nearestCouponAccruedInterest',
        translationKey: 'accruedInterest',
        formattedValue: formatNumber(nearestCoupon.accruedInterest, this.locale)
      });

      descriptors.push({
        id: 'nearestCouponIntervalInDays',
        translationKey: 'intervalInDays',
        formattedValue: formatNumber(nearestCoupon.intervalInDays, this.locale)
      });

      descriptors.push({
        id: 'nearestCouponType',
        translationKey: 'couponType',
        formattedValue: nearestCoupon.couponType,
        valueTranslationKey: 'couponTypeOptions.' + nearestCoupon.couponType
      });

      descriptors.push({
        id: 'nearestCouponAmount',
        translationKey: 'couponAmount',
        formattedValue: this.formatCurrency(nearestCoupon.amount, nearestCoupon.currency ?? currencyCode)
      });

      descriptors.push({
        id: 'nearestCouponDate',
        translationKey: 'date',
        formattedValue: new Date(nearestCoupon.date).toLocaleDateString()
      });
    }

    return descriptors;
  }

  private formatCurrency(value: number, currencyCode: string): string {
    return this.currencyPipe.transform(value, currencyCode, 'symbol-narrow', '0.1-2', this.locale) ?? '';
  }

  private getTradingParametersDescriptors(bond: Bond): Descriptor[] {
    return DescriptorFiller.tradingParameters({
      tradingDetails: bond.tradingDetails,
      currencyInformation: bond.currencyInformation,
      locale: this.locale
    });
  }

  private getTradingDataDescriptors(bond: Bond): Descriptor[] {
    return DescriptorFiller.tradingData({
      tradingDetails: bond.tradingDetails,
      locale: this.locale
    });
  }

  private getAdditionalInfoDescriptors(bond: Bond): Descriptor[] {
    return DescriptorFiller.additionalInformation({
      additionalInfo: bond.additionalInformation,
      locale: this.locale
    });
  }
}
