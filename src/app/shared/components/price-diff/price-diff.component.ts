import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges
} from '@angular/core';
import { DecimalPipe } from "@angular/common";
import { ThemeService } from "../../services/theme.service";
import {
  shareReplay,
  take
} from "rxjs";
import { map } from "rxjs/operators";
import { color } from "d3";

interface PriceDiff {
  fixedPart: string;
  updatedPart: string;
  changeColor: string;
}

@Component({
  selector: 'ats-price-diff',
  templateUrl: './price-diff.component.html',
  styleUrls: ['./price-diff.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceDiffComponent implements OnChanges {
  @Input({ required: true })
  basePrice = 0;

  @Input({ required: true })
  currentPrice = 0;

  @Input()
  format = '1.0-10';

  @Input()
  showChangeForce = true;

  priceDiff: PriceDiff | null = null;
  private readonly numberPipe = new DecimalPipe(this.locale);
  private readonly themeColors$ = this.themeService.getThemeSettings().pipe(
    map(x => x.themeColors),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    @Inject(LOCALE_ID) private readonly locale: string,
    private readonly themeService: ThemeService
  ) {

  }

  ngOnChanges(): void {
    this.update();
  }

  private update(): void {
    const currentPriceStr = this.priceToStr(this.currentPrice);

    if (currentPriceStr.length === 0) {
      this.setDisplayParts(currentPriceStr, '', 0);
      return;
    }

    const basePriceStr = this.priceToStr(this.basePrice);

    const fixedPart: string[] = [];
    const changedPart: string[] = [];
    let changeFound = false;
    for (let i = 0; i < currentPriceStr.length; i++) {
      const currentPriceSymbol = currentPriceStr[i];
      if (changeFound) {
        changedPart.push(currentPriceSymbol);
        continue;
      }

      const basePriceSymbol = basePriceStr[i] as string | undefined;

      if (currentPriceSymbol === basePriceSymbol) {
        fixedPart.push(currentPriceSymbol);
      } else {
        changeFound = true;
        changedPart.push(currentPriceSymbol);
      }
    }

    const changePercent = this.basePrice != 0
      ? ((this.currentPrice - this.basePrice) / this.basePrice) * 100
      : 0;

    this.setDisplayParts(fixedPart.join(''), changedPart.join(''), changePercent);
  }

  private priceToStr(price: number): string {
    return this.numberPipe.transform(price, this.format, this.locale) ?? '';
  }

  private setDisplayParts(fixedPart: string, updatedPart: string, changePercent: number): void {
    this.themeColors$.pipe(
      take(1)
    ).subscribe(themeSettings => {
      let baseColor = color(themeSettings.textColor);
      if (changePercent > 0) {
        baseColor = color(themeSettings.buyColor);
        baseColor!.opacity = this.getColorOpacity(changePercent);
      } else if (changePercent < 0) {
        baseColor = color(themeSettings.sellColor);
        baseColor!.opacity = this.getColorOpacity(changePercent);
      }

      this.priceDiff = {
        fixedPart,
        updatedPart,
        changeColor: baseColor!.formatRgb()
      };
    });
  }

  private getColorOpacity(changePercent: number): number {
    if(!this.showChangeForce) {
      return 1;
    }

    const abs = Math.abs(changePercent);

    if (abs >= 0.5) {
      return 1;
    }

    if (abs >= 0.4) {
      return 0.9;
    }

    if (abs >= 0.3) {
      return 0.8;
    }

    if (abs >= 0.2) {
      return 0.7;
    }

    if (abs >= 0.1) {
      return 0.6;
    }

    return 1;
  }
}
