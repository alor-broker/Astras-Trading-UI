import {
  Injectable,
  OnDestroy
} from '@angular/core';
import { ActionsContext } from "../../../shared/services/actions-context";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { Subject } from "rxjs";

@Injectable()
export class MobileActionsContextService implements ActionsContext, OnDestroy {
  readonly actionEvents$ = new Subject<{ eventType: 'instrumentSelected' }>();

  constructor(private readonly dashboardContextService: DashboardContextService) {
  }

  instrumentSelected(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
    this.actionEvents$.next({
      eventType: "instrumentSelected"
    });
  }

  ngOnDestroy(): void {
    this.actionEvents$.complete();
  }
}
