import { Component, DestroyRef, LOCALE_ID, OnInit, inject } from '@angular/core';
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
  Instrument,
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
} from "zod/v3";
import { InstrumentSchema, } from "../../../../../../generated/graphql.schemas";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzTabComponent,
  NzTabsComponent
} from "ng-zorro-antd/tabs";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import { RisksComponent } from "../risks/risks.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { REFRESH_TIMEOUT_MS } from "../../../constants/info.constants";
import { SectionsListComponent } from "../../sections-list/sections-list.component";
import { SectionComponent } from "../../section/section.component";

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
    NzTabComponent,
    DescriptorsListComponent,
    RisksComponent,
    NzTabsComponent,
    SectionsListComponent,
    SectionComponent
  ],
    templateUrl: './common-info.component.html',
    styleUrl: './common-info.component.less'
})
export class CommonInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  private readonly graphQlService = inject(GraphQlService);
  private readonly translatorService = inject(TranslatorService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  info$!: Observable<Instrument | null>;

  commonDescriptors$!: Observable<DescriptorsGroup[] | null>;

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

    this.info$ = this.instrumentKeyChanges$.pipe(
      filter(i => i != null),
      mapWith(() => refreshTimer$, (source,) => source),
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
