import {Provider} from '@angular/core';
import {RemoteStorageService} from './remote-storage.service';

export function provideRemoteStorage(urlProvider: Provider): Provider[] {
  return [
    urlProvider,
    RemoteStorageService
  ];
}
