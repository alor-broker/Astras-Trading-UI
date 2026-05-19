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
  Query,
  Stock
} from "@terminal-core-lib/features/instruments/graphql/schema/graphql.types";
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
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {InstrumentInfoBase} from '../instrument-info-base/instrument-info-base';
import {REFRESH_TIMEOUT_MS} from '../../constants/instrument-info.constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DescriptorFiller} from '../../utils/descriptor-filler';
import {
  object,
  ZodObject
} from 'zod/v3';
import {
  Modify,
  ZodPropertiesOf
} from '@terminal-core-lib/features/graphql/utils/zod-types.helper';
import {StockSchema} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.schemas';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {
  FetchPolicy,
  GraphQlService
} from '@terminal-core-lib/features/graphql/services/graph-ql.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {DescriptorsList} from '../descriptors-list/descriptors-list';
import {Risks} from '@terminal-widgets-lib/widgets/instrument-info/components/risks/risks';
import {Finance} from '@terminal-widgets-lib/widgets/instrument-info/components/finance/finance';
import {DividendsChart} from '@terminal-widgets-lib/widgets/instrument-info/components/dividends-chart/dividends-chart';
import {Dividends} from '@terminal-widgets-lib/widgets/instrument-info/components/dividends/dividends';
import {SectionsList} from '@terminal-widgets-lib/widgets/instrument-info/components/sections-list/sections-list';
import {Section} from '@terminal-widgets-lib/widgets/instrument-info/components/section/section';

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
    LetDirective,
    NzEmptyComponent,
    NzTabsComponent,
    NzTabComponent,
    NzCollapseComponent,
    DescriptorsList,
    Risks,
    Finance,
    NzCollapsePanelComponent,
    DividendsChart,
    Dividends,
    SectionsList,
    Section
  ],
  templateUrl: './stock-info.html',
  styleUrl: './stock-info.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockInfo extends InstrumentInfoBase implements OnInit {
  info$!: Observable<Stock | null>;

  descriptors$!: Observable<DescriptorsGroup[] | null>;

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
      withRefresh(REFRESH_TIMEOUT_MS, this.applicationStatusService.isActive$),
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
