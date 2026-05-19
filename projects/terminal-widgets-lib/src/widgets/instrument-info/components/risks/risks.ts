import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  switchMap,
  tap
} from "rxjs";
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  Descriptor,
  DescriptorsGroup
} from "../../types/instrument-descriptors.types";
import {TargetInstrumentKey} from "../instrument-info-base/instrument-info-base";
import {toObservable} from "@angular/core/rxjs-interop";
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {RisksService} from '@terminal-core-lib/features/client-info/services/risks.service';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {REFRESH_TIMEOUT_MS} from "../../constants/instrument-info.constants";
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {RisksInfo} from '@terminal-core-lib/features/client-info/services/risks-service.types';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {formatNumber} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {DescriptorsList} from '@terminal-widgets-lib/widgets/instrument-info/components/descriptors-list/descriptors-list';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

@Component({
  selector: 'ats-risks',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzSpinComponent,
    DescriptorsList,
    NzTypographyComponent
  ],
  templateUrl: './risks.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Risks implements OnInit, OnDestroy {
  currentPortfolio$!: Observable<PortfolioKey>;

  isLoading$ = new BehaviorSubject<boolean>(true);

  descriptors$!: Observable<DescriptorsGroup | null>;

  readonly instrumentKey = input.required<TargetInstrumentKey>();

  readonly activated = input<boolean>(false);

  private readonly risksService = inject(RisksService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly translatorService = inject(TranslatorService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly locale = inject(LOCALE_ID);

  private readonly destroyRef = inject(DestroyRef);

  private readonly instrumentKeyChanges$ = toObservable(this.instrumentKey);

  private readonly activatedChanges$ = toObservable(this.activated);

  ngOnInit(): void {
    this.currentPortfolio$ = this.dashboardContextService.selectedPortfolio$;

    const risks$ = combineLatest({
      instrumentKey: this.instrumentKeyChanges$,
      selectedPortfolio: this.currentPortfolio$,
      translator: this.translatorService.getTranslator('')
    }).pipe(
      filter(x => x.instrumentKey != null),
      withRefresh(REFRESH_TIMEOUT_MS, this.applicationStatusService.isActive$),
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
