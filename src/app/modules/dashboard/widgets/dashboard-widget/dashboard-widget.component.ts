import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less']
})
export class DashboardWidgetComponent implements OnInit, OnDestroy {

  private sub: Subscription;

  constructor(private auth: AuthService) {
    this.sub = this.auth.refresh().subscribe();
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
      this.sub.unsubscribe();
  }
}
