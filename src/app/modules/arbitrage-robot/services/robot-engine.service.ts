import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription, throttleTime } from "rxjs";
import { tap } from "rxjs/operators";
import { ArbitrageRobot, TradeDirection } from "../models/arbitrage-robot.model";
import { Side } from "../../../shared/models/enums/side.model";
import { ArbitrageRobotService } from "./arbitrage-robot.service";

@Injectable()
export class RobotEngineService implements OnDestroy {
  private readonly robotService = inject(ArbitrageRobotService);
  private readonly running = new Map<string, Subscription>();

  isRunning(spreadId: string): boolean {
    return this.running.has(spreadId);
  }

  start(spread: ArbitrageRobot): void {
    if (spread.id == null || this.running.has(spread.id)) return;

    const cooldown = Math.max((spread.robotConfig.cooldownSeconds ?? 5) * 1000, 1000);

    const sub = this.robotService.getSpreadsSubscription().pipe(
      throttleTime(cooldown, undefined, { leading: true, trailing: false }),
      tap(spreads => {
        const current = spreads.find(s => s.id === spread.id);
        if (!current) return;

        const cfg = current.robotConfig;
        const volume = cfg.volume ?? 1;
        const maxVol = cfg.maxVolume ?? 1;
        const direction = cfg.direction ?? TradeDirection.All;
        const pos = current.firstLeg.positionsCount ?? 0;

        const hasSellPositions = pos < 0;
        const hasBuyPositions = pos > 0;

        const sellSignal =
          cfg.sellThreshold != null &&
          current.sellSpread != null &&
          current.sellSpread >= cfg.sellThreshold;

        const buySignal =
          cfg.buyThreshold != null &&
          current.buySpread != null &&
          current.buySpread <= cfg.buyThreshold;

        // Закрытие по порогу
        if (cfg.closeThreshold != null && pos !== 0) {
          const shouldClose =
            (pos > 0 && current.sellSpread != null && current.sellSpread <= cfg.closeThreshold) ||
            (pos < 0 && current.buySpread != null && current.buySpread >= cfg.closeThreshold);

          if (shouldClose) {
            this.robotService.closePositions(current, volume).subscribe();
            return;
          }
        }

        // Режим All: принудительное закрытие при смене направления
        if (direction === TradeDirection.All) {
          if (hasSellPositions && buySignal) {
            this.robotService.closePositions(current, volume).subscribe();
            return;
          }
          if (hasBuyPositions && sellSignal) {
            this.robotService.closePositions(current, volume).subscribe();
            return;
          }
        }

        // Открытие Sell-конструкции
        if (
          (direction === TradeDirection.Sell || direction === TradeDirection.All) &&
          sellSignal &&
          !hasBuyPositions &&
          pos > -maxVol
        ) {
          this.robotService.buySpread(current, volume, Side.Sell).subscribe();
          return;
        }

        // Открытие Buy-конструкции
        if (
          (direction === TradeDirection.Buy || direction === TradeDirection.All) &&
          buySignal &&
          !hasSellPositions &&
          pos < maxVol
        ) {
          this.robotService.buySpread(current, volume, Side.Buy).subscribe();
          return;
        }
      })
    ).subscribe();

    this.running.set(spread.id!, sub);
  }

  stop(spreadId: string): void {
    this.running.get(spreadId)?.unsubscribe();
    this.running.delete(spreadId);
  }

  ngOnDestroy(): void {
    this.running.forEach(sub => sub.unsubscribe());
    this.running.clear();
  }
}
