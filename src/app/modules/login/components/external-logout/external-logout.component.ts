import {
  Component,
  OnInit
} from '@angular/core';
import { BroadcastService } from '../../../../shared/services/broadcast.service';
import { ForceLogoutMessageType } from '../../../../shared/services/auth.service';

@Component({
  selector: 'ats-external-logout',
  templateUrl: './external-logout.component.html',
  styleUrls: ['./external-logout.component.less']
})
export class ExternalLogoutComponent implements OnInit {
  constructor(private readonly broadcastService: BroadcastService) {
  }

  ngOnInit(): void {
    const eventListener = (e: any): void => {
      try {
        const json = JSON.parse(e.data) as { source: string } | undefined;
        const origins = [
          'localhost:8001',
          'login.dev.alor.ru',
          'login-dev.alor.ru',
          'login.alor.ru',
        ];

        const currentOrigin = new URL(e.origin);
        if (origins.includes(currentOrigin.host) && json?.source === 'sso') {
          this.broadcastService.publish({ messageType: ForceLogoutMessageType });
          window.removeEventListener('message', eventListener);
        }
      } catch {
      }
    };

    window.addEventListener('message', eventListener);
  }
}
