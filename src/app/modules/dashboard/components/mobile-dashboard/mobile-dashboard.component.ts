import { Component, OnInit } from '@angular/core';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MobileDashboardService } from "../../services/mobile-dashboard.service";

@Component({
  selector: 'ats-mobile-dashboard',
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.less']
})
export class MobileDashboardComponent implements OnInit {

  widgets$!: Observable<Array<any>>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly mobileDashboardService: MobileDashboardService
  ) {
  }

  ngOnInit() {
    this.widgets$ = this.dashboardContextService.selectedDashboard$
      .pipe(
        map(d => d.items)
      );
  }

  tabChange(tab: string) {
    this.mobileDashboardService.changeDashboardTab(tab);
  }
}
