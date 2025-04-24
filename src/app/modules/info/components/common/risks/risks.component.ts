import {
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  Observable,
  tap
} from "rxjs";
import { RisksInfo } from "../../../models/risks.model";
import { DashboardContextService } from "../../../../../shared/services/dashboard-context.service";
import {
  map,
  switchMap
} from "rxjs/operators";
import { PortfolioKey } from "../../../../../shared/models/portfolio-key.model";
import { TargetInstrumentKey } from "../../instrument-info-base/instrument-info-base.component";
import { RisksService } from "../../../services/risks.service";
import { TranslocoDirective } from "@jsverse/transloco";
import { LetDirective } from "@ngrx/component";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import {
  Descriptor,
  DescriptorsGroup
} from "../../../models/instrument-descriptors.model";
import { NzSpinComponent } from "ng-zorro-antd/spin";
import { DescriptorsListComponent } from "../../descriptors-list/descriptors-list.component";
import {
  TranslatorFn,
  TranslatorService
} from "../../../../../shared/services/translator.service";
import { mapWith } from "../../../../../shared/utils/observable-helper";
import { formatNumber } from "@angular/common";

@Component({
    selector: 'ats-risks',
    templateUrl: './risks.component.html',
    styleUrls: ['./risks.component.less'],
    imports: [
        TranslocoDirective,
        LetDirective,
        NzTypographyComponent,
        NzSpinComponent,
        DescriptorsListComponent
    ]
})
export class RisksComponent implements OnInit, OnDestroy {
  currentPortfolio$!: Observable<PortfolioKey>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  descriptors$!: Observable<DescriptorsGroup | null>;
  private readonly targetInstrumentKey$ = new BehaviorSubject<TargetInstrumentKey | null>(null);
  private readonly isActivated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly risksService: RisksService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly translatorService: TranslatorService,
    @Inject(LOCALE_ID) private readonly locale: string
  ) {
  }

  @Input({required: true})
  set instrumentKey(value: TargetInstrumentKey) {
    this.targetInstrumentKey$.next(value);
  };

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnInit(): void {
    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$;

    const risks$ = combineLatest({
      instrumentKey: this.targetInstrumentKey$,
      selectedPortfolio: this.currentPortfolio$,
      translator: this.translatorService.getTranslator('')
    }).pipe(
      filter(x => x.instrumentKey != null),
      tap(() => this.isLoading$.next(true)),
      mapWith(
        x => this.risksService.getRisksInfo(x.instrumentKey!, x.selectedPortfolio),
        (source, risks) => ({
          ...source,
          risks
        })
      ),
      map(x => {
        if (x.risks == null) {
          return null;
        }

        return {
          title: null,
          items: this.getDescriptors(x.risks, x.translator)
        };
      }),
      tap(() => this.isLoading$.next(false))
    );

    this.descriptors$ = this.isActivated$.pipe(
      filter(isActivated => isActivated),
      switchMap(() => risks$),
    );
  }

  ngOnDestroy(): void {
    this.targetInstrumentKey$.complete();
    this.isActivated$.complete();
    this.isLoading$.complete();
  }

  private getDescriptors(risks: RisksInfo, translator: TranslatorFn): Descriptor[] {
    return [
      {
        id: 'isMarginal',
        formattedValue: translator([risks.isMarginal ? 'yes' : 'no'])
      },
      {
        id: 'isShortSellPossible',
        formattedValue: translator([risks.isShortSellPossible ? 'yes' : 'no'])
      },
      {
        id: 'longMultiplier',
        titleTooltipTranslationKey: 'longMultiplier',
        formattedValue: formatNumber(risks.longMultiplier, this.locale, '0.0-6')
      },
      {
        id: 'shortMultiplier',
        titleTooltipTranslationKey: 'shortMultiplier',
        formattedValue: formatNumber(risks.shortMultiplier, this.locale, '0.0-6')
      },
      {
        id: 'currencyLongMultiplier',
        formattedValue: formatNumber(risks.currencyLongMultiplier, this.locale, '0.0-6')
      },
      {
        id: 'currencyShortMultiplier',
        formattedValue: formatNumber(risks.currencyShortMultiplier, this.locale, '0.0-6')
      },
    ];
  }
}
