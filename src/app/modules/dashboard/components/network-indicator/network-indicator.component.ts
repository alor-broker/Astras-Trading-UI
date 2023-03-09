import {
  Component,
  OnInit
} from '@angular/core';
import { NetworkStatusService } from '../../../../shared/services/network-status.service';
import { Observable } from 'rxjs';
import { NetworkStatus } from '../../../../shared/models/enums/network-status.model';

@Component({
  selector: 'ats-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.less']
})
export class NetworkIndicatorComponent implements OnInit {
  statuses = NetworkStatus;
  networkStatus$!: Observable<NetworkStatus>;

  constructor(private readonly networkStatusService: NetworkStatusService) {
  }

  ngOnInit(): void {
    this.networkStatus$ = this.networkStatusService.status$;
  }
}
