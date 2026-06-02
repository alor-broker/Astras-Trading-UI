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
  Modify,
  ZodPropertiesOf
} from "@terminal-core-lib/features/graphql/utils/zod-types.helper";
import {BondSchema} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas";
import {
  Bond,
  Query
} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.types";
import {
  object,
  ZodObject
} from "zod/v3";
import {
  Descriptor,
  DescriptorsGroup
} from "../../types/instrument-descriptors.types";
import {InstrumentInfoBase} from '@terminal-widgets-lib/widgets/instrument-info/components/instrument-info-base/instrument-info-base';
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
  FetchPolicy,
  GraphQlService
} from "@terminal-core-lib/features/graphql/services/graph-ql.service";
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {ApplicationStatusService} from "@terminal-core-lib/common/services/application-status.service";
import {
  CurrencyPipe,
  formatNumber,
  formatPercent
} from "@angular/common";
import {withRefresh} from "@terminal-core-lib/common/utils/observable/with-refresh";
import {REFRESH_TIMEOUT_MS} from "../../constants/instrument-info.constants";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslatorFn} from "@terminal-core-lib/features/translations/services/translator-service.types";
import {DescriptorFiller} from "../../utils/descriptor-filler";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {DescriptorsList} from '@terminal-widgets-lib/widgets/instrument-info/components/descriptors-list/descriptors-list';
import {Risks} from '@terminal-widgets-lib/widgets/instrument-info/components/risks/risks';
import {SectionsList} from '@terminal-widgets-lib/widgets/instrument-info/components/sections-list/sections-list';
import {Section} from '@terminal-widgets-lib/widgets/instrument-info/components/section/section';
import {BondCalendar} from '@terminal-widgets-lib/widgets/instrument-info/components/bond-calendar/bond-calendar';

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
    NzTabsComponent,
    NzTabComponent,
    DescriptorsList,
    Risks,
    SectionsList,
    Section,
    BondCalendar
  ],
  templateUrl: './bond-info.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BondInfo extends InstrumentInfoBase implements OnInit {
  info$!: Observable<Bond | null>;

  descriptors$!: Observable<BondDescriptors | null>;

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
        return this.graphQlService.queryForSchema<BondResponse>(
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
      takeUntilDestroyed(this.destroyRef),
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
        formattedValue: formatPercent(bond.yield.yieldToMaturity / 100, this.locale, '0.1-2')
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
