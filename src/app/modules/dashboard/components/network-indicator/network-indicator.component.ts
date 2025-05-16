import {
  ChangeDetectionStrategy,
  Component,
  OnInit
} from '@angular/core';
import { NetworkStatusService } from '../../../../shared/services/network-status.service';
import { Observable } from 'rxjs';
import { NetworkStatus } from '../../../../shared/models/enums/network-status.model';
import { map } from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe, DecimalPipe, NgClass, NgIf} from "@angular/common";
import {LetDirective} from "@ngrx/component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";

type StatusColor = 'warning' | 'danger' | 'success';
@Component({
    selector: 'ats-network-indicator',
    templateUrl: './network-indicator.component.html',
    styleUrls: ['./network-indicator.component.less'],
    imports: [
        TranslocoDirective,
        AsyncPipe,
        NgIf,
        LetDirective,
        NzTypographyComponent,
        NzTooltipDirective,
        DecimalPipe,
        NgClass,
        NzIconDirective
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkIndicatorComponent implements OnInit {
  statuses = NetworkStatus;
  networkStatus$!: Observable<NetworkStatus>;
  lastDelay$!: Observable<{ delaySec: number, color: StatusColor }>;

  constructor(private readonly networkStatusService: NetworkStatusService) {
  }

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
