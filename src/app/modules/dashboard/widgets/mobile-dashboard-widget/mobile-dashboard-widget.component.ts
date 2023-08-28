import {Component, OnInit} from '@angular/core';
import {fromEvent, Observable} from "rxjs";
import {Store} from "@ngrx/store";
import {PortfoliosActions} from "../../../../store/portfolios/portfolios.actions";
import {map, startWith} from "rxjs/operators";
import {MobileSettingsBrokerService} from "../../services/mobile-settings-broker.service";

@Component({
  selector: 'ats-mobile-dashboard-widget',
  templateUrl: './mobile-dashboard-widget.component.html',
  styleUrls: ['./mobile-dashboard-widget.component.less']
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
    this.store.dispatch(PortfoliosActions.initPortfolios());

    this.screenHeight = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );
  }
}
