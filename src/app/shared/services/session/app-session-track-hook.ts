import { Injectable, inject } from "@angular/core";
import { SessionTrackService } from "./session-track.service";
import { AreaHook } from "../hook/area/area-hook-token";

@Injectable()
export class AppSessionTrackHook implements AreaHook {
  private readonly sessionTrackService = inject(SessionTrackService);

  onDestroy(): void {
    this.sessionTrackService.stopTracking();
  }

  onInit(): void {
    this.sessionTrackService.startTracking();
  }
}
