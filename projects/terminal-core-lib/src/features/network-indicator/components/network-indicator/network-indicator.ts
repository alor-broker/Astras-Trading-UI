import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {NetworkStatusService} from '../../services/network-status.service';
import {NetworkStatus} from '../../netwotk-indicator.types';
import {
  map,
  Observable
} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {LetDirective} from '@ngrx/component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';

type StatusColor = 'warning' | 'danger' | 'success';

@Component({
  selector: 'ats-network-indicator',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    LetDirective,
    NzTypographyComponent,
    NzTooltipDirective,
    DecimalPipe,
    NzIconDirective
  ],
  templateUrl: './network-indicator.html',
  styleUrl: './network-indicator.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    NetworkStatusService
  ]
})
export class NetworkIndicator implements OnInit {
  statuses = NetworkStatus;

  networkStatus$!: Observable<NetworkStatus>;

  lastDelay$!: Observable<{ delaySec: number, color: StatusColor }>;

  private readonly networkStatusService = inject(NetworkStatusService);

  ngOnInit(): void {
    this.networkStatus$ = this.networkStatusService.status$;

    this.lastDelay$ = this.networkStatusService.lastOrderDelayMSec$.pipe(
      map(ms => {
        const delaySec = ms / 1000;
        let color: StatusColor = "success";

        if (delaySec > 1) {
          color = 'warning';
        }

        if (delaySec > 5) {
          color = 'danger';
        }

        return {
          delaySec,
          color
        };
      })
    );
  }
}
