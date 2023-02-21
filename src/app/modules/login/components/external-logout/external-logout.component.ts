import {
  Component,
  OnInit
} from '@angular/core';
import { LocalStorageService } from '../../../../shared/services/local-storage.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { BroadcastService } from '../../../../shared/services/broadcast.service';
import { ForceLogoutMessageType } from '../../../../shared/services/auth.service';

@Component({
  selector: 'ats-external-logout',
  templateUrl: './external-logout.component.html',
  styleUrls: ['./external-logout.component.less']
})
export class ExternalLogoutComponent implements OnInit {
  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly broadcastService: BroadcastService,
    private readonly logger: LoggerService
  ) {
  }

  ngOnInit() {
    const eventListener = (e: any) => {
      try {
        this.logger.info(`[ExternalLogoutComponent]: Message received.`);
        this.logger.info(`Data: ${JSON.stringify(e.data)}`);
        this.logger.info(`Origin: ${JSON.stringify(e.origin)}`);

        const json = JSON.parse(e.data);
        const origins = [
          'localhost:8001',
          'login.dev.alor.ru',
          'login-dev.alor.ru',
          'login.alor.ru',
        ];

        const currentOrigin = new URL(e.origin);
        if (origins.includes(currentOrigin.host) && json?.source === 'sso') {
          this.broadcastService.publish({ messageType: ForceLogoutMessageType });
          this.logger.info('Logout');

          window.removeEventListener('message', eventListener);
        }
      } catch (ex) {
      }
    };

    window.addEventListener('message', eventListener);
  }
}
