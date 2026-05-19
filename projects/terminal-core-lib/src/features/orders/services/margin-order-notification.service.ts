import {
  inject,
  Injectable
} from "@angular/core";
import {NzModalService} from "ng-zorro-antd/modal";
import {
  combineLatest,
  forkJoin,
  Observable,
  of,
  switchMap,
  take
} from "rxjs";
import {map} from "rxjs/operators";
import {USER_CONTEXT} from '../../user-context/user-context.types';
import {TranslatorService} from '../../translations/services/translator.service';
import {HttpClient} from '@angular/common/http';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {Role} from '../../user-context/user.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {TranslatorFn} from '../../translations/services/translator-service.types';
import {FEATURES_CONFIG} from '../../../config/features-config';

export interface TargetPortfolio {
  portfolio: string;
  exchange: string;
}

interface PortfolioRisk {
  portfolio: string;
  exchange: string;
  portfolioEvaluation: number;
  portfolioLiquidationValue: number;
  initialMargin: number;
  minimalMargin: number;
  correctedMargin: number;
  riskCoverageRatioOne: number;
  riskCoverageRatioTwo: number;
  riskCategoryId: number;
  clientType: string;
  hasForbiddenPositions: boolean;
  hasNegativeQuantity: boolean;
}

@Injectable()
export class MarginOrderConfirmationService {
  private readonly userContext = inject(USER_CONTEXT);

  private readonly translatorService = inject(TranslatorService);

  private readonly nzModalService = inject(NzModalService);

  private readonly httpClient = inject(HttpClient);

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly featuresConfig = inject(FEATURES_CONFIG);

  private readonly baseUrl = `${this.coreApiUrlProvider.apiUrl}/md/v2/Clients`;

  checkWithConfirmation(targetPortfolio: TargetPortfolio): Observable<boolean | null> {
    return this.checkWithConfirmationMultiple([targetPortfolio]);
  }

  checkWithConfirmationMultiple(targetPortfolios: TargetPortfolio[]): Observable<boolean | null> {
    if (this.featuresConfig.lowClientRiskCheck ?? false) {
      return combineLatest({
        translator: this.translatorService.getTranslator('order-commands'),
        translatorCommon: this.translatorService.getTranslator(''),
        user: this.userContext.getUser(),
      }).pipe(
        take(1),
        switchMap(x => {
          if (x.user.roles == null || x.user.roles.includes(Role.Client)) {
            const distinctPortfolios = new Map(targetPortfolios.map(p => [`${p.portfolio}:${p.exchange}`, p]));

            return forkJoin(Array.from(distinctPortfolios.values()).map(p => this.shouldShowNotification({
              portfolio: p.portfolio,
              exchange: p.exchange
            })))
              .pipe(
                take(1),
                switchMap(c => {
                  const shouldShowNotification = c.some(i => i ?? true);
                  if (shouldShowNotification ?? true) {
                    return new Observable<boolean | null>(subscriber => {
                      this.showConfirmation(
                        x.translator,
                        x.translatorCommon,
                        () => subscriber.next(true),
                        () => subscriber.complete()
                      );
                    });
                  }

                  return of(null);
                })
              );
          }

          return of(null);
        })
      );
    }

    return of(null);
  }

  private shouldShowNotification(targetPortfolio: TargetPortfolio): Observable<boolean | null> {
    return this.httpClient.get<PortfolioRisk>(
      `${this.baseUrl}/${targetPortfolio.exchange}/${targetPortfolio.portfolio}/risk`,
      {
        params: {
          format: 'simple'
        }
      }
    ).pipe(
      catchHttpError<PortfolioRisk | null>(null),
      map(r => {
        if (r == null) {
          return null;
        }

        return r.clientType === 'LowRisk' && r.riskCategoryId !== 100;
      }),
      take(1)
    );
  }

  private showConfirmation(
    translator: TranslatorFn,
    translatorCommon: TranslatorFn,
    onConfirmAction: () => void,
    onRejectAction: () => void,
  ): void {
    this.nzModalService.confirm({
      nzTitle: translator(['marginOrderConfirmationTitle']),
      nzContent: translator(['marginOrderConfirmationContent']),
      nzOkText: translatorCommon(['yes']),
      nzCancelText: translatorCommon(['no']),
      nzIconType: 'exclamation-circle',
      nzOnOk: () => onConfirmAction(),
      nzOnCancel: () => onRejectAction(),
    });
  }
}
