import {Provider} from '@angular/core';
import {ActivityTrackerService} from './services/activity-tracker.service';
import {SessionInstantTranslatableNotificationsService} from './services/session-instant-translatable-notifications.service';
import {SessionTrackService} from './services/session-track.service';

export function provideSessionTrack(): Provider[] {
  return [
    ActivityTrackerService,
    SessionInstantTranslatableNotificationsService,
    SessionTrackService
  ];
}
