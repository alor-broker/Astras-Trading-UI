import {Component, OnInit} from '@angular/core';
import {fromEvent, Observable} from "rxjs";
import {Store} from "@ngrx/store";
import {map, startWith} from "rxjs/operators";
import {MobileSettingsBrokerService} from "../../services/mobile-settings-broker.service";
import { PortfoliosInternalActions } from "../../../../store/portfolios/portfolios.actions";
import { WidgetsLocalStateInternalActions } from "../../../../store/widgets-local-state/widgets-local-state.actions";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { MobileActionsContextService } from "../../services/mobile-actions-context.service";

@Component({
  selector: 'ats-mobile-dashboard-widget',
  templateUrl: './mobile-dashboard-widget.component.html',
  styleUrls: ['./mobile-dashboard-widget.component.less'],
  providers: [
    MobileActionsContextService,
    {
      provide: ACTIONS_CONTEXT,
      useExisting: MobileActionsContextService
    }
  ]
})
export class MobileDashboardWidgetComponent implements OnInit {
  screenHeight!: Observable<number>;

  constructor(
    private readonly mobileSettingsBrokerService: MobileSettingsBrokerService,
    private readonly store: Store
  ) {
  }

  ngOnInit(): void {
    this.mobileSettingsBrokerService.initSettingsBrokers();
    this.store.dispatch(PortfoliosInternalActions.init());
    this.store.dispatch(WidgetsLocalStateInternalActions.init());

    this.screenHeight = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );
  }
}
