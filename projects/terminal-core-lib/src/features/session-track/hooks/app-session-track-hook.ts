import {
  inject,
  Injectable
} from "@angular/core";
import {Hook} from '../../../common/types/hook.types';
import {SessionTrackService} from '../services/session-track.service';

@Injectable()
export class AppSessionTrackHook implements Hook {
  private readonly sessionTrackService = inject(SessionTrackService);

  onDestroy(): void {
    this.sessionTrackService.stopTracking();
  }

  onInit(): void {
    this.sessionTrackService.startTracking();
  }
}
