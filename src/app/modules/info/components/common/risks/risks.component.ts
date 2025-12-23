import { Component, DestroyRef, input, LOCALE_ID, OnDestroy, OnInit, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, defer, filter, Observable, tap, timer} from "rxjs";
import {RisksInfo} from "../../../models/risks.model";
import {DashboardContextService} from "../../../../../shared/services/dashboard-context.service";
import {map, switchMap} from "rxjs/operators";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import {TargetInstrumentKey} from "../../instrument-info-base/instrument-info-base.component";
import {RisksService} from "../../../services/risks.service";
import {TranslocoDirective} from "@jsverse/transloco";
import {LetDirective} from "@ngrx/component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {Descriptor, DescriptorsGroup} from "../../../models/instrument-descriptors.model";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {DescriptorsListComponent} from "../../descriptors-list/descriptors-list.component";
import {TranslatorFn, TranslatorService} from "../../../../../shared/services/translator.service";
import {mapWith} from "../../../../../shared/utils/observable-helper";
import {formatNumber} from "@angular/common";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {REFRESH_TIMEOUT_MS} from "../../../constants/info.constants";

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
  private readonly risksService = inject(RisksService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly translatorService = inject(TranslatorService);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  currentPortfolio$!: Observable<PortfolioKey>;
  isLoading$ = new BehaviorSubject<boolean>(true);
  descriptors$!: Observable<DescriptorsGroup | null>;
  readonly instrumentKey = input.required<TargetInstrumentKey>();
  readonly activated = input<boolean>(false);
  private readonly instrumentKeyChanges$ = toObservable(this.instrumentKey);
  private readonly activatedChanges$ = toObservable(this.activated);

  ngOnInit(): void {
    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$;

    const refreshTimer$ = defer(() => {
      return timer(0, REFRESH_TIMEOUT_MS).pipe(
        takeUntilDestroyed(this.destroyRef)
      );
    });

    const risks$ = combineLatest({
      instrumentKey: this.instrumentKeyChanges$,
      selectedPortfolio: this.currentPortfolio$,
      translator: this.translatorService.getTranslator('')
    }).pipe(
      filter(x => x.instrumentKey != null),
      mapWith(() => refreshTimer$, (source,) => source),
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

    this.descriptors$ = this.activatedChanges$.pipe(
      filter(isActivated => isActivated),
      switchMap(() => risks$),
    );
  }

  ngOnDestroy(): void {
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
