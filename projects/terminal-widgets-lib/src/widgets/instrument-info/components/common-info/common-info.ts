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
import {InstrumentSchema} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas";
import {
  Instrument,
  Query
} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.types";
import {
  object,
  ZodObject
} from "zod/v3";
import {InstrumentInfoBase} from "../instrument-info-base/instrument-info-base";
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
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {REFRESH_TIMEOUT_MS} from '@terminal-widgets-lib/widgets/instrument-info/constants/instrument-info.constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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

type InstrumentResponse = Modify<
  Query,
  'instrument',
  {
    instrument: Instrument | null;
  }
>;

const ResponseSchema: ZodObject<ZodPropertiesOf<InstrumentResponse>> = object({
  instrument: InstrumentSchema()
});

@Component({
  selector: 'ats-common-info',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzEmptyComponent,
    NzTabsComponent,
    NzTabComponent,
    DescriptorsList,
    Risks,
    SectionsList,
    Section
  ],
  templateUrl: './common-info.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonInfo extends InstrumentInfoBase implements OnInit {
  info$!: Observable<Instrument | null>;

  commonDescriptors$!: Observable<DescriptorsGroup[] | null>;

  private readonly graphQlService = inject(GraphQlService);

  private readonly translatorService = inject(TranslatorService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly locale = inject(LOCALE_ID);

  private readonly destroyRef = inject(DestroyRef);

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
        return this.graphQlService.queryForSchema<InstrumentResponse>(
          ResponseSchema,
          {
            symbol: {value: i.symbol, required: true},
            exchange: {value: i.exchange, required: true},
            board: {value: i.board, required: true},
          },
          {fetchPolicy: FetchPolicy.NoCache}
        ).pipe(
          map(r => r?.instrument ?? null)
        );
      }),
      tap(() => this.setLoading(false)),
      takeUntilDestroyed(this.destroyRef),
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

  private getBasicInformationDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.basicInformation({
      basicInformation: instrument.basicInformation,
      boardInformation: instrument.boardInformation,
      financialAttributes: instrument.financialAttributes,
      currencyInformation: instrument.currencyInformation
    });
  }

  private getCurrencyDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.currencyInformation(instrument.currencyInformation);
  }

  private getTradingParametersDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.tradingParameters({
      tradingDetails: instrument.tradingDetails,
      currencyInformation: instrument.currencyInformation,
      locale: this.locale
    });
  }

  private getTradingDataDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.tradingData({
      tradingDetails: instrument.tradingDetails,
      locale: this.locale
    });
  }

  private getAdditionalInfoDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.additionalInformation({
      additionalInfo: instrument.additionalInformation,
      locale: this.locale
    });
  }
}
