import { Injectable } from "@angular/core";
import { SessionTrackService } from "./session-track.service";
import { AreaHook } from "../hook/area/area-hook-token";

@Injectable()
export class AppSessionTrackHook implements AreaHook {
  constructor(private readonly sessionTrackService: SessionTrackService) {
  }

  onDestroy(): void {
    this.sessionTrackService.stopTracking();
  }

  onInit(): void {
    this.sessionTrackService.startTracking();
  }
}
