import {AppHook} from "../app-hook/app-hook-token";
import {Injectable} from "@angular/core";
import {SessionTrackService} from "./session-track.service";

@Injectable()
export class AppSessionTrackHook implements AppHook {
  constructor(private readonly sessionTrackService: SessionTrackService) {
  }

  onDestroy(): void {
    this.sessionTrackService.stopTracking();
  }

  onInit(): void {
    this.sessionTrackService.startTracking();
  }
}
