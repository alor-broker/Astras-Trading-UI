import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'ats-dashboard-widget',
  templateUrl: './dashboard-widget.component.html',
  styleUrls: ['./dashboard-widget.component.less']
})
export class DashboardWidgetComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private auth: AuthService, private readonly onboarding: OnboardingService, private readonly modal: ModalService) {
  }

  ngOnInit(): void {
    this.auth.refresh().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
    this.onboarding.start();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
