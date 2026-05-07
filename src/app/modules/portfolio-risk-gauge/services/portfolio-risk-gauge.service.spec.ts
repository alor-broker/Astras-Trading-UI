import { TestBed } from '@angular/core/testing';
import {
  firstValueFrom,
  of,
  throwError
} from "rxjs";
import {
  skip,
  take
} from "rxjs/operators";
import {
  MarketType,
  PortfolioKey
} from "../../../shared/models/portfolio-key.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { Risks } from "../../blotter/models/risks.model";
import { PortfolioRiskState } from "../models/portfolio-risk-gauge.model";
import { PortfolioRiskGaugeService } from "./portfolio-risk-gauge.service";

describe('PortfolioRiskGaugeService', () => {
  let service: PortfolioRiskGaugeService;
  let portfolioSubscriptionsService: jasmine.SpyObj<PortfolioSubscriptionsService>;

  const createRisk = (): Risks => ({
    portfolio: 'D1234',
    exchange: 'MOEX',
    portfolioEvaluation: 99980,
    portfolioLiquidationValue: 100980,
    initialMargin: 76900,
    minimalMargin: 38450,
    correctedMargin: 38450,
    riskCoverageRatioOne: 23080,
    riskCoverageRatioTwo: 61530,
    riskCategoryId: 1,
    clientType: 'StandardRisk',
    hasForbiddenPositions: false,
    hasNegativeQuantity: false,
    riskStatus: 'Ok'
  });

  beforeEach(() => {
    portfolioSubscriptionsService = jasmine.createSpyObj<PortfolioSubscriptionsService>(
      'PortfolioSubscriptionsService',
      [
        'getRisksSubscription',
        'getSpectraRisksSubscription'
      ]
    );

    TestBed.configureTestingModule({
      providers: [
        PortfolioRiskGaugeService,
        {
          provide: PortfolioSubscriptionsService,
          useValue: portfolioSubscriptionsService
        }
      ]
    });

    service = TestBed.inject(PortfolioRiskGaugeService);
  });

  it('should use unified risks subscription for all portfolio market types', async () => {
    portfolioSubscriptionsService.getRisksSubscription.and.returnValue(of(createRisk()));

    const portfolioKeys: PortfolioKey[] = [
      { portfolio: 'D1234', exchange: 'MOEX', marketType: MarketType.Stock },
      { portfolio: 'D1234-F', exchange: 'MOEX', marketType: MarketType.Forward },
      { portfolio: 'D1234-EDP', exchange: 'MOEX', marketType: MarketType.United }
    ];

    const views = await Promise.all(
      portfolioKeys.map(portfolioKey => firstValueFrom(
        service.getGaugeView(portfolioKey).pipe(
          skip(1),
          take(1)
        )
      ))
    );

    expect(views.every(view => view.state === PortfolioRiskState.Green)).toBeTrue();
    expect(portfolioSubscriptionsService.getRisksSubscription).toHaveBeenCalledTimes(portfolioKeys.length);
    expect(portfolioSubscriptionsService.getSpectraRisksSubscription).not.toHaveBeenCalled();
  });

  it('should return no data when risks subscription fails', async () => {
    portfolioSubscriptionsService.getRisksSubscription.and.returnValue(throwError(() => new Error('failed')));

    const view = await firstValueFrom(
      service.getGaugeView({ portfolio: 'D1234', exchange: 'MOEX', marketType: MarketType.Stock }).pipe(
        skip(1),
        take(1)
      )
    );

    expect(view.state).toBe(PortfolioRiskState.NoData);
    expect(portfolioSubscriptionsService.getSpectraRisksSubscription).not.toHaveBeenCalled();
  });
});
