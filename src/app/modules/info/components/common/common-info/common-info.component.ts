import {
  Component,
  Inject,
  LOCALE_ID,
  OnInit
} from '@angular/core';
import { InstrumentInfoBaseComponent } from "../../instrument-info-base/instrument-info-base.component";
import {
  combineLatest,
  Observable,
  shareReplay,
  switchMap,
  tap
} from "rxjs";
import {
  Instrument,
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
import { InstrumentSchema, } from "../../../../../../generated/graphql.schemas";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzTabComponent,
  NzTabSetComponent
} from "ng-zorro-antd/tabs";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";

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
        NzTabSetComponent,
        NzTabComponent,
        DescriptorsListComponent
    ],
    templateUrl: './common-info.component.html',
    styleUrl: './common-info.component.less'
})
export class CommonInfoComponent extends InstrumentInfoBaseComponent implements OnInit {
  info$!: Observable<Instrument | null>;

  commonDescriptors$!: Observable<DescriptorsGroup[] | null>;

  constructor(
    private readonly graphQlService: GraphQlService,
    private readonly translatorService: TranslatorService,
    @Inject(LOCALE_ID)
    private readonly locale: string
  ) {
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
        return this.graphQlService.watchQueryForSchema<InstrumentResponse>(
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
            title: x.translator(['groupTitles', 'tradingDetails']),
            items: this.getTradingDetailsDescriptors(x.info)
          }
        ];
      })
    );
  }

  private getBasicInformationDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.basicInformation({
      basicInformation: instrument.basicInformation,
      financialAttributes: instrument.financialAttributes,
      currencyInformation: instrument.currencyInformation
    });
  }

  private getTradingDetailsDescriptors(instrument: Instrument): Descriptor[] {
    return DescriptorFiller.tradingDetails({
      tradingDetails: instrument.tradingDetails,
      currencyInformation: instrument.currencyInformation,
      locale: this.locale
    });
  }
}
