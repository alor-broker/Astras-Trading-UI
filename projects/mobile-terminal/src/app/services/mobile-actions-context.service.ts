import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {ActionsContext} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {MobileDashboardContextService} from '../features/dashboard/services/mobile-dashboard-context.service';
import {Subject} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

@Injectable()
export class MobileActionsContextService implements ActionsContext, OnDestroy {
  readonly actionEvents$ = new Subject<{
    eventType: 'instrumentSelected';
  }>();

  private readonly dashboardContextService = inject(MobileDashboardContextService);

  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
    this.actionEvents$.next({
      eventType: "instrumentSelected"
    });
  }

  ngOnDestroy(): void {
    this.actionEvents$.complete();
  }
}
