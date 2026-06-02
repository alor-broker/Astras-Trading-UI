import {
  firstValueFrom,
  of
} from 'rxjs';
import {PriceDiffHelper} from './price-diff.helper';
import {PositionFixtures} from '@testing-lib/fixtures/position';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';

describe('PriceDiffHelper', () => {
  describe('getPositionDiff', () => {
    const positionWithAvgPrice = (avgPrice: number): Position => PositionFixtures.createPosition({avgPrice});

    it('should compute a positive diff when the price is above the average price', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(110), of(positionWithAvgPrice(100)))
      );

      expect(result).toEqual({percent: 10, sign: 1});
    });

    it('should report the magnitude and a negative sign when the price is below the average price', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(90), of(positionWithAvgPrice(100)))
      );

      expect(result).toEqual({percent: 10, sign: -1});
    });

    it('should round the percent to three decimals', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(100.12345), of(positionWithAvgPrice(100)))
      );

      expect(result).toEqual({percent: 0.123, sign: 1});
    });

    it('should return null when the price is missing', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(null), of(positionWithAvgPrice(100)))
      );

      expect(result).toBeNull();
    });

    it('should return null when there is no position', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(110), of(null))
      );

      expect(result).toBeNull();
    });

    it('should return null when the position has no average price', async () => {
      const result = await firstValueFrom(
        PriceDiffHelper.getPositionDiff(of(110), of(positionWithAvgPrice(0)))
      );

      expect(result).toBeNull();
    });
  });
});
